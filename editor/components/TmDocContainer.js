
const Document = require('./Document')
module.exports = {
  name: 'TmDocContainer',
  components: {Document},
  data() {
    return {
      raw: null
    }
  },
  computed: {
    root() {
      return this.$md(this.raw)
    }
  },
  methods: {
    async fetchDoc(name) {
      const doc = await fetch(`../documents/${name}.tmd`)
      return doc.text()
    },
    setContent() {
      this.fetchDoc(this.doc).then(ret => {
        this.raw = ret
        /* this.content = ret
        this.$nextTick(() => {
          new Promise((resolve, reject) => {
            window.require(['vs/editor/editor.main'], () => {
              defineLanguage('black')
              resolve()
            })
          }).then(() => {
            const codes = this.$el.getElementsByClassName('language-tm')
            Array.prototype.forEach.call(codes, el => {
              el.setAttribute('data-lang', 'tm')
              window.monaco.editor.colorizeElement(el, { theme: 'tm' })
            })
          })
        }) */
      })
    }
  },
  created() {
    this.setContent()
  },
  watch: {
    doc(val) {
      this.setContent()
    }
  },
  props: ['doc'],
  template: `<div>
    <Document :content="root"></Document>
  </div>`
}
