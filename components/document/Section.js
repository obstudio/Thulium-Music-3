module.exports = {
  name: 'Section',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `<div>
    <component :is="'h'+node.level" v-html="node.text"></component>
    <div style="margin-left: 20px">
      <component v-for="(comp, index) in node.content" :is="comp.type" :node="comp" :key="index"></component>
    </div>
  </div>`
}
