module.exports = {
  name: 'TmDocBlockquote',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<blockquote :class="node.mode">
    <component v-for="(item, index) in node.content" :is="'tm-doc-' + item.type" :node="item" :key="index"/>
  </blockquote>`)
}
