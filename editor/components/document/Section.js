
module.exports = {
  name: 'Section',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `<component :is="'h'+node.level" v-html="node.text"></component>`
}
