<template>
  <nav ref="navbar" :class="['navbar', 'navbar-expand-md', themeOptions, addClass, fixedOptions]">
    <div class="container-fluid">
      <div class="navbar-brand">
        <slot name="brand"/>
      </div>
      <button v-if="!slots.collapse" class="navbar-toggler" type="button" aria-expanded="false" aria-label="Toggle navigation" @click="toggleCollapse">
        <span class="navbar-toggler-icon"/>
        <slot name="collapse"/>
      </button>

      <div :class="['navbar-collapse',{collapse:collapsed}]">
        <ul class="navbar-nav mr-auto mt-2 mt-lg-0">
          <slot/>
        </ul>
        <ul v-if="slots.right" class="navbar-nav navbar-right">
          <slot name="right"/>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
  import $ from './utils/NodeList.js'
  import { toBoolean } from './utils/utils';
  import normalizeUrl from './utils/urls';

  export default {
    props: {
      type: {
        type: String,
        default: 'primary'
      },
      addClass: {
        type: String,
        default: ''
      },
      fixed: {
        type: Boolean,
        default: false
      },
      defaultHighlightOn: {
        type: String,
        default: 'sibling-or-child'
      }
    },
    data () {
      return {
        id: 'bs-example-navbar-collapse-1',
        collapsed: true,
        styles: {},
      }
    },
    computed: {
      fixedBool() {
        return toBoolean(this.fixed);
      },
      fixedOptions() {
        if (this.fixedBool) {
          return 'navbar-fixed';
        }
        return '';
      },
      slots () {
        return this.$slots
      },
      themeOptions () {
        switch (this.type) {
        case 'none':
          return ''
        case 'light':
          return 'navbar-light bg-light'
        case 'dark':
          return 'navbar-dark bg-dark'
        case 'primary':
        default:
          return 'navbar-dark bg-primary'
        }
      },
    },
    methods: {
      toggleCollapse (e) {
        e && e.preventDefault()
        this.collapsed = !this.collapsed
      },
      // Splits a normalised URL into its parts, e.g http://site.org/foo/bar/index.html -> ['foo','bar','index.html']
      splitUrl(url) {
        const u = new URL(normalizeUrl(url));
        return `${u.pathname}`.substr(1).split('/');
      },
      isSibling(url, href) {
        const hParts = this.splitUrl(href);
        const uParts = this.splitUrl(url);
        if (hParts.length !== uParts.length) {
          return false;
        }
        for (let i = 0; i < hParts.length - 1; i++) {
          if (hParts[i] !== uParts[i]) {
            return false;
          }
        }
        return true;
      },
      isChild(url, href) {
        const hParts = this.splitUrl(href);
        const uParts = this.splitUrl(url);
        if (uParts.length <= hParts.length) {
          return false;
        }
        for (let i = 0; i < hParts.length; i++) {
          if (hParts[i] !== uParts[i]) {
            return false;
          }
        }
        return true;
      },
      isExact(url, href) {
        return normalizeUrl(url) === normalizeUrl(href);
      },
      addClassIfDropdown(dropdownLinks, a) {
        if (dropdownLinks.includes(a)) {
          a.classList.add('dropdown-current');
        }
      },
      highlightLink(url) {
        const defHlMode = this.defaultHighlightOn;
        const navLis = Array.from(this.$el.querySelector('.navbar-nav').children);
        // attempt an exact match first
        for (const li of navLis) {
          const standardLinks = [li];
          const navLinks = Array.from(li.querySelectorAll('a.nav-link'));
          const dropdownLinks = Array.from(li.querySelectorAll('a.dropdown-item'));
          const allNavLinks = standardLinks.concat(navLinks).concat(dropdownLinks).filter(a => a.href);
          for (const a of allNavLinks) {
            const hlMode = a.getAttribute('highlight-on') || defHlMode;
            if (hlMode === 'none') {
              continue;
            }
            // terminate early on an exact match
            if (this.isExact(url, a.href)) {
              li.classList.add('current');
              this.addClassIfDropdown(dropdownLinks, a);
              return;
            }
          }
        }
        // fallback to user preference, otherwise
        for (const li of navLis) {
          const standardLinks = [li];
          const navLinks = Array.from(li.querySelectorAll('a.nav-link'));
          const dropdownLinks = Array.from(li.querySelectorAll('a.dropdown-item'));
          const allNavLinks = standardLinks.concat(navLinks).concat(dropdownLinks).filter(a => a.href);
          for (const a of allNavLinks) {
            const hlMode = a.getAttribute('highlight-on') || defHlMode;
            if (hlMode === 'none') {
              continue;
            }
            if (hlMode === 'sibling-or-child') {
              if (this.isSibling(url, a.href) || this.isChild(url, a.href)) {
                li.classList.add('current');
                this.addClassIfDropdown(dropdownLinks, a);
                return;
              }
            } else if (hlMode === 'sibling') {
              if (this.isSibling(url, a.href)) {
                li.classList.add('current');
                this.addClassIfDropdown(dropdownLinks, a);
                return;
              }
            } else if (hlMode === 'child') {
              if (this.isChild(url, a.href)) {
                li.classList.add('current');
                this.addClassIfDropdown(dropdownLinks, a);
                return;
              }
            } else {
              console.log("Ignoring invalid navbar highlight rule")
            }
          }
        }
      }
    },
    created () {
      this._navbar = true
    },
    mounted () {
      let $dropdown = $('.dropdown>[data-toggle="dropdown"]',this.$el).parent()
      $dropdown.on('click', '.dropdown-toggle', (e) => {
        e.preventDefault()
        $dropdown.each((content) => {
          if (content.contains(e.target)) content.classList.toggle('open')
        })
      }).on('click', '.dropdown-menu>li>a', (e) => {
        $dropdown.each((content) => {
          if (content.contains(e.target)) content.classList.remove('open')
        })
      }).onBlur((e) => {
        $dropdown.each((content) => {
          if (!content.contains(e.target)) content.classList.remove('open')
        })
      })
      $(this.$el).on('click','li:not(.dropdown)>a', e => {
        setTimeout(() => { this.collapsed = true }, 200)
      }).onBlur(e => {
        if (!this.$el.contains(e.target)) { this.collapsed = true }
      })
      if (this.slots.collapse) $('[data-toggle="collapse"]',this.$el).on('click', (e) => this.toggleCollapse(e))

      // highlight current nav link
      this.highlightLink(window.location.href);
    },
    beforeDestroy () {
      $('.dropdown',this.$el).off('click').offBlur()
      if (this.slots.collapse) $('[data-toggle="collapse"]',this.$el).off('click')
    }
  }
</script>

<style scoped>
  @media (max-width: 767px) {
    .navbar-collapse {
      max-height: 80vh !important;
      overflow-x: hidden !important;
      overflow-y: scroll !important;
    }
  }

  .navbar-fixed {
    position: fixed;
    width: 100%;
    z-index: 1000;
  }

  >>> .dropdown-current {
    color: #fff;
    background: #007bff;
  }
</style>
