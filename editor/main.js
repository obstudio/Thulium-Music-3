const Vue = require('vue')
const ElementUI = require('element-ui')
const VueI18n = require('vue-i18n')
// const Icon = require('vue-awesome/components/Icon')
const router = require('./router')
const App = require('./App')
const extendVue = require('./TmVueExt')
// require('node_modules/vue-awesome/dist/vue-awesome.js')

Vue.use(VueI18n)
Vue.use(ElementUI)
extendVue(Vue)
Vue.component('icon', Icon)
Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
