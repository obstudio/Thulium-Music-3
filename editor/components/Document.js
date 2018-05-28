
require('./document/index')

module.exports = {
  name: 'Document',
  props: {
    content: {
      type: Array,
      required: true
    }
  },
  template: `<template>
    <div>
      <component v-for="(comp, index) in content" :is="comp.type" :node="comp" :key="index"></component>
    </div>
  </template>`
}
