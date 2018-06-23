module.exports = {
  name: 'Heading',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<component :is="'h'+node.level" v-html="node.text"></component>`)
}
