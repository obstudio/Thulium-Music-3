const path = require('path')

function uriFromPath(...paths) {
  const result = path.resolve(path.join(...paths)).split(path.sep)
    .map(name => name
      .replace(/#/g, '%23')
      .replace(/ /g, '%20')
    ).join('/')
  return 'file:///' + result
}

amdRequire.config({
  baseUrl: uriFromPath(__dirname, 'node_modules/monaco-editor/min')
})

// work around monaco not understanding the environment
self.module = undefined
self.process.browser = true

const Vue = require('vue/dist/vue.common')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
const Router = require('vue-router')

const TmUser = require('./user')
const Player = require('./library/player')
const Lexer = require('./library/tmdoc/Lexer')
const TmEditor = require('./components/TmEditor')
const TmDoc = require('./components/TmDoc')
const HelloWorld = require('./components/HelloWorld')

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
        component: HelloWorld
      },
      {
        path: '/editor',
        name: 'TmEditor',
        component: TmEditor,
        props: {
          width: '100%',
          height: '100%'
        }
      },
      {
        path: '/docs/:doc?',
        name: 'TmDocument',
        component: TmDoc
      }
    ]
  }),

  data() {
    return {
      title: 'Thulium Music',
      status: 'succeed'
    }
  },

  template: `<div>
    <div class="navbar">{{ title }}</div>
    <div class="window"><router-view/></div>
    <div class="status">{{ status }}</div>
  </div>`
})
