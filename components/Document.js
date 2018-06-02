
require('./document/index')

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
