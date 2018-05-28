const Vue = require('vue/dist/vue.common')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
const router = require('./router')
const extendVue = require('./TmVueExt')

amdRequire.config({ paths: { 'vs': '../node_modules/monaco-editor/min/vs/' }})

// Vue files can not be used
// const Icon = require('vue-awesome/components/Icon')
// require('node_modules/vue-awesome/dist/vue-awesome.js')

const App = {
  name: 'App',
  template: `<div id="app" class="window">
    <router-view/>
    <!-- <footer-player style="text-align: center;" :InitialTime="75" :TotalTime="100" :Volume="75"/> -->
  </div>`
}

Vue.use(VueI18n)
Vue.use(ElementUI)
extendVue(Vue)
// Vue.component('icon', Icon)
Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
