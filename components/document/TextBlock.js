module.exports = {
  name: 'Textblock',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `<span v-html="node.text"></span>`
}
