
const { defineLanguage } = require('../../Editor')
module.exports = {
  name: 'Code',
  data() {
    return {
      res: ''
    }
  },
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  mounted() {
    if ('monaco' in window) {
      window.monaco.editor
        .colorize(this.node.content, this.node.lang)
        .then(res => {
          this.res = res
        })
    } else {
      window.require(['vs/editor/editor.main'], () => {
        defineLanguage()
        window.monaco.editor
          .colorize(this.node.content, this.node.lang)
          .then(res => {
            this.res = res
          })
      })
    }
  },
  template: `<template>
    <div v-html="res"></div>
  </template>`
}