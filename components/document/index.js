const Vue = require('vue')

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
  render: VueCompile(`<div class="tm-doc">
    <component v-for="(comp, index) in content" :is="comp.type" :node="comp" :key="index"></component>
  </div>`)
}
