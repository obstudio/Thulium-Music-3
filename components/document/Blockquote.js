
module.exports = {
  name: 'Blockquote',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `<blockquote>
    <component v-for="(comp, index) in node.content" :is="comp.type" :node="comp" :key="index"></component>
  </blockquote>`
}
