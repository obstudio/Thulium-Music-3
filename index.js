const Vue = require('vue/dist/vue.common')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')

const TmUser = require('./user')
const Player = require('./library/player')
const Lexer = require('./library/tmdoc/Lexer')
const TmEditor = require('./components/TmEditor')
const TmDoc = require('./components/TmDoc')
const Entry = require('./components/Entry')

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
        component: Entry
      },
      {
        path: '/editor',
        name: 'TmEditor',
        component: TmEditor
      },
      {
        path: '/docs',
        name: 'TmDocument',
        component: TmDoc
      }
    ]
  }),
  mounted() {
    addEventListener('resize', () => {
      this.height = window.innerHeight - 48
      this.width = window.innerWidth - 64
    }, {passive: true})
  },
  data() {
    return {
      title: 'Thulium Music',
      status: 'succeed',
      height: 600 - 48, // initial height
      width: 800 - 64
    }
  },
  template: `<div>
  <div class="navbar">{{ title }}</div>
  <div class="window">
    <div style="height: 100%; width: 64px; background: #545c64; position: absolute;">
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
    <keep-alive>
      <router-view :height="height"
                   style="vertical-align: top; position: absolute; left: 64px; right: 0; height: 100%"/>
    </keep-alive>
  </div>
</div>`
})
