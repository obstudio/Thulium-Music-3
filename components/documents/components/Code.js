module.exports = {
  name: 'TmDocCode',
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
  computed: {
    theme() {
      return this.$store.state.Settings.theme
    }
  },
  watch: {
    node: 'render',
    theme: 'render'
  },
  mounted() {
    this.render()
  },
  methods: {
    render() {
      window.monaco.editor
        .colorize(this.node.code, this.node.lang)
        .then(result => this.content = result)
    }
  },
  render() {
    return this._c('div', {
      staticClass: "codeblock",
      domProps: {
        innerHTML: this._s(this.content)
      }
    })
  }
}
