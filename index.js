const Vue = require('vue')
const ElementUI = require('element-ui/lib')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')
const Vuex = require('vuex')
const VueCompiler = require('vue-template-compiler/browser')

const Player = require('./library/player')
const Lexer = require('./library/tmdoc/Lexer')
// Vue files can not be used
// const Icon = require('vue-awesome/components/Icon')
// require('node_modules/vue-awesome/dist/vue-awesome.js')
// Vue.component('icon', Icon)

Vue.use(Vuex)
Vue.use(Router)
Vue.use(VueI18n)
Vue.use(ElementUI)
Vue.config.productionTip = false
Vue.prototype.$createPlayer = (source, spec) => {
  return new Player(source, spec)
}
Vue.prototype.$markdown = (content) => {
  if (typeof content !== 'string') return []
  return new Lexer().lex(content)
}

global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}
global.remote = require('electron').remote
global.user = new Vuex.Store(require('./user'))

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
      component: require('./components/document/document')
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
      height: 600 - 48, // initial height
      width: 800 - 64, // initial width
      sidebar: true,
      browser: global.remote.getCurrentWindow()
    }
  },

  computed: {
    settings: () => global.user.state.Settings,
    styles: () => global.user.state.Styles
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

  render: VueCompile(`<div :class="settings.theme">
    <div :class="{'show-sidebar': sidebar}">
    <div class="navbar">
      <button class="sidebar-toggler" @click="sidebar = !sidebar">
        <div v-if="sidebar">
          <svg viewBox="0 0 1024 1024" width="24" height="24">
            <path
              d="M862.485 481.154H234.126l203.3-203.3c12.497-12.497 12.497-32.758 0-45.255s-32.758-12.497
              -45.255 0L135.397 489.373c-12.497 12.497-12.497 32.758 0 45.254l256.774 256.775c6.249 6.248
              14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372c12.497-12.497 12.497-32.759 0-45.255
              l-203.3-203.301h628.36c17.036 0 30.846-13.81 30.846-30.846s-13.81-30.846-30.846-30.846z"/>
          </svg>
        </div>
        <div v-else>
          <svg viewBox="0 0 1024 1024" width="24" height="24">
            <path
              d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497
              32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811
              30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248
              14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z"/>
          </svg>
        </div>
      </button>
      <div class="title">{{ $t('window.title') }}</div>
      <div class="top-right">
        <button @click="browser.minimize()" class="minimize">
          <svg viewBox="0 0 1024 1024" width="12" height="12">
            <path
              d="M65.23884 456.152041 958.760137 456.152041l0 111.695918L65.23884 567.847959 65.23884 456.152041z"/>
          </svg>
        </button>
        <button @click="toggleMaximize()" class="maximize">
          <svg viewBox="0 0 1157 1024" width="16" height="12">
            <path
              d="M1086.033752 753.710082 878.220684 753.710082 878.220684 951.774989 878.220684 1021.784509
              878.220684 1023.113804 808.211164 1023.113804 808.211164 1021.784509 70.895716 1021.784509
              70.895716 1023.113804 0.886196 1023.113804 0.886196 1021.784509 0.886196 951.774989 0.886196
              339.413241 0.886196 269.403721 70.895716 269.403721 269.403721 269.403721 269.403721 0.886196
              274.277802 0.886196 339.413241 0.886196 1086.033752 0.886196 1151.612289 0.886196 1156.043271
              0.886196 1156.043271 683.700563 1156.043271 753.710082 1086.033752 753.710082ZM70.895716
              951.774989 808.211164 951.774989 808.211164 753.710082 808.211164 683.700563 808.211164
              339.413241 70.895716 339.413241 70.895716 951.774989ZM1086.033752 70.895716 339.413241
              70.895716 339.413241 269.403721 808.211164 269.403721 878.220684 269.403721 878.220684
              339.413241 878.220684 683.700563 1086.033752 683.700563 1086.033752 70.895716Z"/>
          </svg>
        </button>
        <button @click="browser.close()" class="close">
          <svg viewBox="0 0 1024 1024" width="12" height="12">
            <path
              d="M564.89472 512l381.58336-381.5936c14.61248-14.60736 14.61248-38.28736 0-52.89472
              s-38.29248-14.60736-52.8896 0L512 459.10528l-381.5936-381.5936A37.4016 37.4016 0 1 0 
              77.51168 130.4064L459.10528 512l-381.5936 381.58848a37.39648 37.39648 0 0 0 0 52.8896 
              37.39136 37.39136 0 0 0 52.89472 0L512 564.89472l381.58848 381.58336
              a37.38624 37.38624 0 0 0 52.8896 0 37.38624 37.38624 0 0 0 0-52.8896L564.89472 512z"/>
          </svg>
        </button>
      </div>
      <div class="top-border"></div>
    </div>
    <div class="window">
      <div class="sidebar">
        <el-menu default-active="/" :collapse="true" :router="true"
          :backgroundColor="'#' + styles.sidebar.background">
          <el-menu-item index="/">
            <i class="el-icon-menu"></i>
            <span slot="title">{{ $t('window.homepage') }}</span>
          </el-menu-item>
          <el-menu-item index="/editor">
            <i class="el-icon-edit"></i>
            <span slot="title">{{ $t('window.editor') }}</span>
          </el-menu-item>
          <el-menu-item index="/docs">
            <i class="el-icon-document"></i>
            <span slot="title">{{ $t('window.documents') }}</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <i class="el-icon-setting"></i>
            <span slot="title">{{ $t('window.settings') }}</span>
          </el-menu-item>
        </el-menu>
        <div class="left-border"></div>
      </div>
      <div class="main">
        <keep-alive>
          <router-view :height="height" :width="width"/>
        </keep-alive>
      </div>
    </div>
    </div>
  </div>`)
})
