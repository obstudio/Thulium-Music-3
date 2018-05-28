const Vue = require('vue/dist/vue.common')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
// const Icon = require('vue-awesome/components/Icon')
const router = require('./router')
const App = require('./App')
const extendVue = require('./TmVueExt')

amdRequire.config({ paths: { 'vs': '../node_modules/monaco-editor/min/vs/' }})

// require('node_modules/vue-awesome/dist/vue-awesome.js')

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
