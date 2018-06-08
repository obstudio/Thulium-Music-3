const Vue = require('vue')
const ElementUI = require('element-ui/lib')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')
const Vuex = require('vuex')
const VueCompiler = require('vue-template-compiler/browser')
global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

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

global.remote = require('electron').remote
global.user = new Vuex.Store(require('./user'))

new Vue({
  el: '#app',
  router: new Router({
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
  }),

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
    captions: () => global.user.state.Captions.window,
    styles: () => global.user.state.Styles,
    title: () => global.user.state.Title()
  },

  methods: {
    toggleMaximize() {
      if (this.browser.isMaximized()) {
        this.browser.unmaximize()
      } else {
        this.browser.maximize()
      }
    },
    switchRoute: (route) => global.user.state.Route = route
  },

  render: VueCompile(`<div :class="settings.theme">
    <div :class="{'show-sidebar': sidebar}">
    <div class="navbar">
      <button class="sidebar-toggler" @click="sidebar = !sidebar">
        <div v-if="sidebar"><i class="icon-arrow-left"/></div>
        <div v-else><i class="icon-arrow-right"/></div>
      </button>
      <div class="title">{{ title }}</div>
      <div class="top-right">
        <button @click="browser.minimize()" class="minimize"><i class="icon-window-minimize"/></button>
        <button @click="toggleMaximize()" class="maximize"><i class="icon-window-maximize"/></button>
        <button @click="browser.close()" class="close"><i class="icon-window-close"/></button>
      </div>
      <div class="top-border"/>
    </div>
    <div class="window">
      <div class="sidebar">
        <el-menu default-active="/" :collapse="true" :router="true"
          :backgroundColor="'#' + styles.sidebar.background">
          <el-menu-item index="/" @click="switchRoute('homepage')">
            <i class="icon-home"></i>
            <span slot="title">{{ captions.homepage }}</span>
          </el-menu-item>
          <el-menu-item index="/editor" @click="switchRoute('editor')">
            <i class="icon-editor"></i>
            <span slot="title">{{ captions.editor }}</span>
          </el-menu-item>
          <el-menu-item index="/docs" @click="switchRoute('documents')">
            <i class="icon-document"></i>
            <span slot="title">{{ captions.documents }}</span>
          </el-menu-item>
          <el-menu-item index="/settings" @click="switchRoute('settings')">
            <i class="icon-settings"></i>
            <span slot="title">{{ captions.settings }}</span>
          </el-menu-item>
        </el-menu>
        <div class="left-border"/>
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
