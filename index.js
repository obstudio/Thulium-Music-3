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
        component: TmEditor,
        props: {
          width: '100%'
        }
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
      this.height = window.innerHeight - 76
    })
  },
  data() {
    return {
      title: 'Thulium Music',
      status: 'succeed',
      height: 600 - 76 // initial height
    }
  },
  template: `<div>
  <div class="navbar">{{ title }}</div>
  <div class="window">
    <router-view :height="height"/>
  </div>
  <div class="status">{{ status }}</div>
</div>`
})
