<template>
  <ul v-if="node.inline">
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
  </ol>
</template>

<script>
export default {
  name: 'List',
  props: {
    node: {
      type: Object,
      required: true
    }
  }
}
</script>

<style>

</style>
