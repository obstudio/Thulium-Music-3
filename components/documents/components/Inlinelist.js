module.exports = {
  name: 'TmDocInlinelist',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<ul class="tm-horizontal">
    <li v-for="(item, index) in node.content" :key="index" v-html="item"/>
  </ul>`)
}
