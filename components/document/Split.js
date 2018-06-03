module.exports = {
  name: 'Split',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `<hr :class="[node.style === 1 ? node.double ? 'dd' : 'dash' : node.double ? 'double' : 'normal']">`
}
