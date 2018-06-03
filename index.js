const Vue = require('vue/dist/vue.common')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')

const TmUser = require('./user')
const Player = require('./library/player')
const Lexer = require('./library/tmdoc/Lexer')

// Vue files can not be used
// const Icon = require('vue-awesome/components/Icon')
// require('node_modules/vue-awesome/dist/vue-awesome.js')
// Vue.component('icon', Icon)

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

new Vue({
  el: '#app',
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
        component: require('./components/TmEditor')
      },
      {
        path: '/docs',
        name: 'TmDocument',
        component: require('./components/TmDoc')
      }
    ]
  }),

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
      sidebar: true
    }
  },

  template: `<div :class="{ 'sidebar-showed': sidebar }">
    <div class="navbar">
      <button @click="sidebar = !sidebar">{{ sidebar ? '<' : '>' }}</button>
      <div class="title">{{ title }}</div>
    </div>
    <div class="window">
      <div class="sidebar">
        <el-menu default-active="1" :collapse="true" background-color="#545c64" :router="true">
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
      <div class="main" :width="width">
        <keep-alive>
          <router-view :height="height"/>
        </keep-alive>
      </div>
    </div>
  </div>`
})
