<template>
  <component :is="'h'+node.level" v-html="node.text"></component>
</template>

<script>
export default {
  name: 'Heading',
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
