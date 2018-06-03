const Vue = require('vue/dist/vue.common')

Vue.component('Code', require('./Code'))
Vue.component('List', require('./List'))
Vue.component('Split', require('./Split'))
Vue.component('Table', require('./Table'))
Vue.component('Textblock', require('./Textblock'))
Vue.component('Paragraph', require('./Paragraph'))
Vue.component('Heading', require('./Heading'))
Vue.component('Section', require('./Section'))
Vue.component('Blockquote', require('./Blockquote'))

module.exports = {
  name: 'Document',
  props: {
    content: {
      type: Array,
      required: true
    }
  },
  template: `<div class="tm-doc-root">
    <component v-for="(comp, index) in content" :is="comp.type" :node="comp" :key="index"></component>
  </div>`
}
