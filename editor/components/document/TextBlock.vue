<template>
  <span v-html="node.text"></span>
</template>

<script>
export default {
  name: 'Textblock',
  props: {
    node: {
      type: Object,
      required: true
    }
  }
}
</script>

<style></style>
