
module.exports = {
  name: 'Paragraph',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  template: `<template>
    <p v-html="node.text"></p>
  </template>`
}
