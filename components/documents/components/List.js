module.exports = {
  name: 'TmDocList',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render: VueCompile(`
  <ul v-if="!node.ordered">
    <li v-for="(item, index) in node.content" :key="index">
      <component v-for="(comp, index) in item" :key="index" :is="comp.type" :node="comp"/>
    </li>
  </ul>
  <ol v-else>
    <li v-for="(item, index) in node.content" :key="index">
      <component v-for="(comp, index) in item" :key="index" :is="comp.type" :node="comp"/>
    </li>
  </ol>`)
}
