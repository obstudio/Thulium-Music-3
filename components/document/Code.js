const { defineLanguage } = require('../../library/editor/Editor')
const theme = require('../../themes/Theme')

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
  watch: {
    node(newNode) {
      this.render(newNode)
    }
  },
  mounted() {
    this.render(this.node)
  },
  methods: {
    render(node) {
      if ('monaco' in window) {
        window.monaco.editor
          .colorize(node.content, node.lang)
          .then(res => this.res = res)
      } else {
        amdRequire(['vs/editor/editor.main'], () => {
          defineLanguage(theme)
          this.render(node)
        })
      }
    }
  },
  template: `<div v-html="res"></div>`
}
