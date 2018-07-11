module.exports = {
  name: 'TmDocSection',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<div>
    <component :is="'h'+(node.level+1)" v-html="node.text"></component>
    <div style="margin-left: 20px">
      <component v-for="(comp, index) in node.content" :is="comp.type" :node="comp" :key="index"></component>
    </div>
  </div>`)
}
