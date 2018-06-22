module.exports = {
  name: 'Usage',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<div class="usage">
    <blockquote v-for="(usage, index) in node.content" :key="index">
      <component v-for="(comp, index) in usage" :is="comp.type" :node="comp" :key="index"/>
    </blockquote>
  </div>`)
}
