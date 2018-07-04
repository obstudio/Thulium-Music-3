const electron = require('electron')
const ElementUI = require('element-ui/lib')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')
const Vuex = require('vuex')
const Vue = require('vue')
const fs = require('fs')
const VueCompiler = require('vue-template-compiler/browser')

const Lexer = require('./library/tmdoc/Lexer')

Vue.use(Vuex)
Vue.use(Router)
Vue.use(VueI18n)
Vue.use(ElementUI)
Vue.config.productionTip = false
Vue.prototype.$markdown = (content, options = {}) => {
  if (typeof content !== 'string') return []
  return new Lexer(options).lex(content)
}

// Global Environment
//   0: production mode
//   1: developing mode
//   2: debugging mode
global.env = 1
global.remote = electron.remote
global.user = new Vuex.Store(require('./user'))

global.getRender = function(filepath) {
  if (global.env === 0 && fs.existsSync(filepath + '.js')) {
    return require(filepath)
  } else {
    const html = fs.readFileSync(filepath, { encoding: 'utf8' })
    const result = VueCompiler.compileToFunctions(html).render
    fs.writeFileSync(filepath + '.js',
      'module.exports = ' + result.toString(),
      { encoding: 'utf8' }
    )
    return result
  }
}

if (global.env) {
  electron.ipcRenderer.send('build', global.env === 1 ? false : true)
}

addEventListener('beforeunload', () => {
  electron.ipcRenderer.send('close')
})

global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

const i18n = new VueI18n({
  locale: global.user.state.Settings.language,
  fallbackLocale: 'zh-CN',
  messages: new Proxy({}, {
    get(target, key) {
      if (key in target || !global.library.LanguageSet.has(key)) {
        return target[key]
      } else {
        const locale = require(`./languages/${key}/general.json`)
        target[key] = locale
        return locale
      }
    }
  })
})

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: require('./components/homepage/entry')
    },
    {
      path: '/editor',
      name: 'TmEditor',
      component: require('./components/Editor/editor')
    },
    {
      path: '/docs',
      name: 'TmDocument',
      component: require('./components/documents/documents')
    },
    {
      path: '/settings',
      name: 'Settings',
      component: require('./components/Settings/settings')
    }
  ]
})

new Vue({
  el: '#app',
  router,
  i18n,

  watch: {
    sidebar(value) {
      this.width = window.innerWidth - (value ? 64 : 0)
    }
  },

  mounted() {
    addEventListener('resize', () => {
      this.height = window.innerHeight - 48
      this.width = window.innerWidth - (this.sidebar ? 64 : 0)
    }, {passive: true})
  },

  data() {
    return {
      height: document.body.clientHeight - 48, // initial height
      width: document.body.clientWidth - 64, // initial width
      sidebar: true,
      browser: global.remote.getCurrentWindow()
    }
  },

  computed: {
    settings: () => global.user.state.Settings,
    styles: () => global.user.state.Styles,
    title() {
      return global.user.state.Prefix[global.user.state.Route]
        + this.$t(`${global.user.state.Route}.title`)
    }
  },

  methods: {
    toggleMaximize() {
      if (this.browser.isMaximized()) {
        this.browser.unmaximize()
      } else {
        this.browser.maximize()
      }
    },
    switchRoute(route) {
      global.user.state.Route = route
    }
  },

  render: getRender(__dirname + '/app.html')
})
