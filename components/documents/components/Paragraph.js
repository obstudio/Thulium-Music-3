module.exports = {
  name: 'TmDocParagraph',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<p v-html="node.text"></p>`)
}
