<template>
  <div>
    <component v-for="(comp, index) in content" :is="comp.type" :node="comp" :key="index"></component>
  </div>
</template>

<script>
import './document/index'

export default {
  name: 'Document',
  props: {
    content: {
      type: Array,
      required: true
    }
  }
}
</script>

<style>

</style>
