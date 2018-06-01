const Vue = require('vue/dist/vue.common')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
const router = require('./editor/router')
const Player = require('./library/player')
const Lexer = require('./library/tmdoc/Lexer')

// Vue files can not be used
// const Icon = require('vue-awesome/components/Icon')
// require('node_modules/vue-awesome/dist/vue-awesome.js')
// Vue.component('icon', Icon)

const App = {
  name: 'App',
  template: `<div id="app" class="window">
    <router-view/>
    <!-- <footer-player style="text-align: center;" :InitialTime="75" :TotalTime="100" :Volume="75"/> -->
  </div>`
}

Vue.use(VueI18n)
Vue.use(ElementUI)
Vue.prototype.$createPlayer = (v) => new Player(v)
Vue.prototype.$md = (content) => {
  if (typeof content !== 'string') return []
  return new Lexer().lex(content)
}

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
