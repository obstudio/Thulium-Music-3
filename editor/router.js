const Vue = require('vue/dist/vue.common')
const Router = require('vue-router')
const TmEditor = require('./components/TmEditor')
const TmDoc = require('./components/TmDoc')
const HelloWorld = require('./components/HelloWorld')

Vue.use(Router)

module.exports = new Router({
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
        height: '524px'
      }
    },
    {
      path: '/docs/:doc?',
      name: 'TmDocument',
      component: TmDoc
    }
  ]
})
