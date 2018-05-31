const { defineLanguage } = require('../../../library/editor/Editor')
const theme = require('../../../themes/Theme').tokenizer

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
      amdRequire(['vs/editor/editor.main'], () => {
        defineLanguage(theme)
        window.monaco.editor
          .colorize(this.node.content, this.node.lang)
          .then(res => {
            this.res = res
          })
      })
    }
  },
  template: `<div v-html="res"></div>`
}
