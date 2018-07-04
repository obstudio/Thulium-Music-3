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
    },
    'global.user.state.Settings.theme'() {
      this.$nextTick(() => this.render(this.node))
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
