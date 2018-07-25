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

global.getRender = function(filepath) {
  if (global.env === 0 && fs.existsSync(filepath + '.js')) {
    return require(filepath + '.js')
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

electron.ipcRenderer.send('start', global.env)

addEventListener('beforeunload', () => {
  electron.ipcRenderer.send('close')
})

global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

const user = require('./settings/user')
const store = new Vuex.Store(user)

const i18n = new VueI18n({
  locale: user.state.Settings.language,
  fallbackLocale: user.state.Settings.fallback,
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
      name: 'homepage',
      component: require('./components/homepage/entry')
    },
    {
      path: '/editor',
      name: 'editor',
      component: require('./components/Editor/editor')
    },
    {
      path: '/docs',
      name: 'documents',
      component: require('./components/documents/documents')
    },
    {
      path: '/settings',
      name: 'settings',
      component: require('./components/Settings/settings')
    }
  ]
})

new Vue({
  el: '#app',
  router,
  i18n,
  store,

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
    settings() {
      return this.$store.state.Settings
    },
    styles() {
      return this.$store.state.Styles
    },
    title() {
      return this.$store.state.Prefix[this.$route.name]
        + this.$t(`${this.$route.name}.title`)
    }
  },

  methods: {
    toggleMaximize() {
      if (this.browser.isMaximized()) {
        this.browser.unmaximize()
      } else {
        this.browser.maximize()
      }
    }
  },

  render: getRender(__dirname + '/app.html')
})
