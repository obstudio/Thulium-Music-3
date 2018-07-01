module.exports = {
  name: 'TmDocSeparator',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<hr :class="[node.style === 1 ? node.double ? 'dd' : 'dash' : node.double ? 'double' : 'normal']">`)
}
