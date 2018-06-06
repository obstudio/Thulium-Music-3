const Vue = require('vue')
const ElementUI = require('element-ui/lib')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')
const Vuex = require('vuex')
const VueCompiler = require('vue-template-compiler/browser')
global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

global.remote = require('electron').remote
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
Vue.prototype.$createPlayer = (source, spec) => {
  return new Player(source, spec)
}
Vue.prototype.$markdown = (content) => {
  if (typeof content !== 'string') return []
  return new Lexer().lex(content)
}

Vue.config.productionTip = false

global.user = new Vuex.Store({
  state: require('./user'),
  mutations: {
    setSetting({key, value}) {
      this.state.Settings[key] = value
    }
  }
})

new Vue({
  el: '#app',
  store: global.store,
  router: new Router({
    routes: [
      {
        path: '/',
        name: 'HomePage',
        component: require('./components/Entry')
      },
      {
        path: '/editor',
        name: 'TmEditor',
        component: require('./components/Editor')
      },
      {
        path: '/docs',
        name: 'TmDocument',
        component: require('./components/Document')
      },
      {
        path: '/settings',
        name: 'Settings',
        component: require('./components/Settings')
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
      title: 'Thulium Music',
      status: 'succeed',
      height: 600 - 48, // initial height
      width: 800 - 64,
      sidebar: true,
      browser: global.remote.getCurrentWindow()
    }
  },

  computed: {
    settings: () => global.user.state.Settings
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

  render: VueCompile(`<div :class="[{'sidebar-showed': sidebar}, settings.theme]">
    <div class="navbar">
      <div class="top-border"></div>
      <button class="sidebar-toggler" @click="sidebar = !sidebar">
        {{ sidebar ? '<' : '>' }}
      </button>
      <div class="title">{{ title }}</div>
      <div class="top-right">
        <button @click="browser.minimize()" class="minimize">-</button>
        <button @click="toggleMaximize()" class="maximize">0</button>
        <button @click="browser.close()" class="close">x</button>
      </div>
    </div>
    <div class="window">
      <div class="sidebar">
        <div class="left-border"></div>
        <el-menu default-active="/" :collapse="true" background-color="#545c64" :router="true">
          <el-menu-item index="/">
            <i class="el-icon-menu"></i>
            <span slot="title">主页</span>
          </el-menu-item>
          <el-menu-item index="/editor">
            <i class="el-icon-edit"></i>
            <span slot="title">编辑器</span>
          </el-menu-item>
          <el-menu-item index="/docs">
            <i class="el-icon-document"></i>
            <span slot="title">文档</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <i class="el-icon-setting"></i>
            <span slot="title">设置</span>
          </el-menu-item>
        </el-menu>
      </div>
      <div class="main">
        <keep-alive>
          <router-view :height="height" :width="width"/>
        </keep-alive>
      </div>
    </div>
  </div>`)
})
