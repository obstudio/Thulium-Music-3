module.exports = {
  name: 'TmDocText',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<span v-html="node.text"></span>`)
}
