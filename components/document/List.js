module.exports = {
  name: 'List',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `
  <ul v-if="node.inline" class="tm-horizontal">
    <li v-for="(item, index) in node.content" :key="index" v-html="item"></li>
  </ul>
  <ul v-else-if="!node.ordered">
    <li v-for="(item, index) in node.content" :key="index">
      <component v-for="(comp, index) in item.content" :key="index" :is="comp.type" :node="comp"></component>
    </li>
  </ul>
  <ol v-else>
    <li v-for="(item, index) in node.content" :key="index">
      <component v-for="(comp, index) in item.content" :key="index" :is="comp.type" :node="comp"></component>
    </li>
  </ol>`
}
