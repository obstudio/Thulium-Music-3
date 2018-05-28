<template>
<div>
  <textarea v-model="raw" title="输入测试"></textarea>
  <Document :content="root"></Document>
</div>
</template>

<script>
import Document from './Document.vue'
export default {
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
      const doc = await fetch(`/static/docs/${name}.tmd`)
      return doc.text()
    },
    setContent() {
      this.fetchDoc(this.doc).then(ret => {
        this.content = this.$md(ret).result
        /* this.content = ret
        this.$nextTick(() => {
          new Promise((resolve, reject) => {
            window.require(['vs/editor/editor.main'], () => {
              defineLanguage()
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
      this.doc = val
      this.setContent()
    }
  },
  props: ['doc']
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.tm {
  display: block;
  background-color: black;
  padding: 10px;
}
</style>
