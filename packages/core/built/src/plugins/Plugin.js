var path = require('path');
var fs = require('fs-extra');
var cheerio = require('cheerio');
require('../patches/htmlparser2');
var PLUGIN_OUTPUT_SITE_ASSET_FOLDER_NAME = 'plugins';
var utils = require('../utils');
var logger = require('../utils/logger');
/**
 * Wrapper class around a loaded plugin module
 */
var Plugin = /** @class */ (function () {
    function Plugin(pluginName, pluginPath, pluginOptions, siteOutputPath) {
        this.pluginName = pluginName;
        /**
         * The plugin module
         * @type {Object}
         */
        // eslint-disable-next-line global-require,import/no-dynamic-require
        this.plugin = require(pluginPath);
        /**
         * @type {Object<string, any>}
         */
        this.pluginOptions = pluginOptions || {};
        // For resolving plugin asset source paths later
        this.pluginAbsolutePath = path.dirname(pluginPath);
        this.pluginAssetOutputPath = path.join(siteOutputPath, PLUGIN_OUTPUT_SITE_ASSET_FOLDER_NAME, path.basename(pluginPath, '.js'));
    }
    Plugin.prototype.executeBeforeSiteGenerate = function () {
        if (this.plugin.beforeSiteGenerate) {
            this.plugin.beforeSiteGenerate(this.pluginOptions);
        }
    };
    /**
     * Resolves a resource specified as an attribute in a html asset tag
     * (eg. '<script>' or '<link>') provided by a plugin, and copies said asset
     * into the plugin's asset output folder.
     * Does nothing if the resource is a url.
     * @param assetElementHtml The asset element html, as a string, such as '<script src="...">'
     * @param tagName The name of the resource tag
     * @param attrName The attribute name where the resource is specified in the tag
     * @param baseUrl baseUrl of the site
     * @return String html of the element, with the attribute's asset resolved
     */
    Plugin.prototype._getResolvedAssetElement = function (assetElementHtml, tagName, attrName, baseUrl) {
        var _this = this;
        var $ = cheerio.load(assetElementHtml);
        var el = $(tagName + "[" + attrName + "]");
        el.attr(attrName, function (i, assetPath) {
            if (!assetPath || utils.isUrl(assetPath)) {
                return assetPath;
            }
            var srcPath = path.resolve(_this.pluginAbsolutePath, assetPath);
            var srcBaseName = path.basename(srcPath);
            fs.ensureDir(_this.pluginAssetOutputPath)
                .then(function () {
                var outputPath = path.join(_this.pluginAssetOutputPath, srcBaseName);
                fs.copySync(srcPath, outputPath, { overwrite: false });
            })
                .catch(function (err) { return logger.error("Failed to copy asset " + assetPath + " for plugin " + _this.pluginName + "\n" + err); });
            return path.posix.join(baseUrl + "/", PLUGIN_OUTPUT_SITE_ASSET_FOLDER_NAME, _this.pluginName, srcBaseName);
        });
        return $.html();
    };
    /**
     * Collect page content inserted by plugins
     */
    Plugin.prototype.getPageNjkLinksAndScripts = function (frontMatter, content, baseUrl) {
        var _this = this;
        var links = [];
        var scripts = [];
        if (this.plugin.getLinks) {
            var pluginLinks = this.plugin.getLinks(this.pluginOptions, frontMatter, content);
            links = pluginLinks.map(function (linkHtml) { return _this._getResolvedAssetElement(linkHtml, 'link', 'href', baseUrl); });
        }
        if (this.plugin.getScripts) {
            var pluginScripts = this.plugin.getScripts(this.pluginOptions, frontMatter, content);
            scripts = pluginScripts.map(function (scriptHtml) { return _this._getResolvedAssetElement(scriptHtml, 'script', 'src', baseUrl); });
        }
        return {
            links: links,
            scripts: scripts,
        };
    };
    Plugin.prototype.postRender = function (frontMatter, content) {
        if (this.plugin.postRender) {
            return this.plugin.postRender(this.pluginOptions, frontMatter, content);
        }
        return content;
    };
    Plugin.prototype.processNode = function (node, config) {
        if (!this.plugin.processNode) {
            return;
        }
        this.plugin.processNode(this.pluginOptions, node, config);
    };
    Plugin.prototype.getTagConfig = function () {
        return this.plugin.tagConfig;
    };
    return Plugin;
}());
module.exports = {
    Plugin: Plugin,
};