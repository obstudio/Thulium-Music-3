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
      window.monaco.editor.colorize(node.code, node.lang).then(res => this.res = res)
    }
  },
  render: VueCompile(`<div class="codeblock" v-html="res"/>`)
}
