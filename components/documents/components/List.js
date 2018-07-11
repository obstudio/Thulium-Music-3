module.exports = {
  name: 'TmDocList',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`<component :is="node.ordered ? 'ol' : 'ul'">
    <li v-for="(item, index) in node.content" :key="index">
      <component v-for="(comp, index) in item" :key="index" :is="'tm-doc-' + comp.type" :node="comp"/>
    </li>
  </component>`)
}
