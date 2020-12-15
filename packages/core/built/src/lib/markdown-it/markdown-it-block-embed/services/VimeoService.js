// Copyright (c) Rotorz Limited and portions by original markdown-it-video authors
// Licensed under the MIT license. See LICENSE file in the project root.
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var VideoServiceBase = require("./VideoServiceBase");
var VimeoService = /** @class */ (function (_super) {
    __extends(VimeoService, _super);
    function VimeoService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VimeoService.prototype.getDefaultOptions = function () {
        return { width: 500, height: 281 };
    };
    VimeoService.prototype.extractVideoID = function (reference) {
        var match = reference.match(/https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
        return match && typeof match[3] === "string" ? match[3] : reference;
    };
    VimeoService.prototype.getVideoUrl = function (videoID) {
        var escapedVideoID = this.env.md.utils.escapeHtml(videoID);
        return "//player.vimeo.com/video/" + escapedVideoID;
    };
    return VimeoService;
}(VideoServiceBase));
module.exports = VimeoService;