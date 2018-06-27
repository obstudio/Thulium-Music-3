const Vue = require('vue')
const open = require('opn')
const SmoothScroll = require('../SmoothScroll')

;[
  'Code', 'List', 'Split', 'Table', 'Textblock',
  'Paragraph', 'Heading', 'Section', 'Blockquote', 'Usage'
].forEach(name => Vue.component(name, require('./components/' + name)))

module.exports = {
  name: 'TmDoc',

  provide() {
    return {
      switchDoc: this.switchDoc,
      execute: this.executeMethod
    }
  },

  components: {
    TmDocVariant: {
      name: 'TmDocVariant',
      computed: {
        index() {
          return this.base + '/' + 
            (this.item instanceof Array ? this.item : this.item.name)[0]
        }
      },
      props: ['item', 'base'],
      inject: ['switchDoc'],
      render: getRender(__dirname + '/doc-variant.html')
    }
  },

  mixins: [
    require('../command')('documents'),
    require('./History')
  ],

  data() {
    return {
      openedMenu: [],
      root: [],
      catalog: false,
      search: false,
      docScrolled: false,
      menuScrolled: false
    }
  },

  computed: {
    styles: () => global.user.state.Styles,
    catalogWidth() {
      return Math.min(Math.max(this.width / 3, 160), 200)
    },
    contentWidth() {
      return this.width - (this.catalog ? this.catalogWidth : 0)
    },
    activeIndex() {
      return this.current.anchor ? `${this.current.path}#${this.current.anchor}` : this.current.path
    }
  },

  mounted() {
    window.monaco.editor.setTheme(global.user.state.Settings.theme)
    this.docScroll = SmoothScroll(this.$refs.doc, {}, (doc) => {
      this.docScrolled = doc.scrollTop > 0
    })
    this.menuScroll = SmoothScroll(this.$refs.menu, {}, (menu) => {
      this.menuScrolled = menu.scrollTop > 0
    })
  },

  methods: {
    setContent() {
      return (async () => {
        try {
          const doc = await fetch(`./documents${this.current.path}.tmd`)
          const text = await doc.text()
          this.root = this.$markdown(text)
        } catch (e) {
          this.move(-1)
          return
        }
        global.user.state.Prefix.documents = this.root[0].text + ' - '
        const scroll = this.$refs.doc.scrollTop
        this.h2nodes = Array.from(this.$refs.doc.getElementsByTagName('h2'))
        this.$nextTick(() => {
          if (typeof this.current.scroll === 'string') {
            this.switchToAnchor(this.current.anchor)
          } else {
            this.docScroll(this.current.scroll - scroll)
          }
          const parts = this.current.path.match(/\/[^/]+/g)
          let last = ''
          const arr = []
          for (const part of parts) {
            last += part
            arr.push(last)
          }
          arr.forEach(item => this.$refs.elMenu.open(item))
          this.current.scroll = this.$refs.doc.scrollTop // save scroll info, better way?
        })
      })()
    },
    navigate(event) {
      let url = event.srcElement.dataset.rawUrl
      if (!url) return
      if (url.startsWith('$issue#')) {
        open('https://github.com/obstudio/Thulium-Music-3/issues/' + url.slice(7))
      } else if (url.startsWith('#')) {
        this.switchDoc(this.current.path + url)
      } else {
        const docParts = this.current.path.split('/')
        const back = /^(?:\.\.\/)*/.exec(url)[0].length
        docParts.splice(-1 - back / 3, Infinity, url.slice(back))
        this.switchDoc(docParts.join('/'))
      }
    },
    switchToAnchor(text) {
      if (!text) {
        text = this.current.anchor
      } else {
        this.current.anchor = text
      }
      const result = this.h2nodes.find(node => node.textContent === text)
      if (result) {
        this.docScroll(result.offsetTop - this.$refs.doc.scrollTop)
      }
    }
  },
  
  props: ['width', 'height', 'left', 'top'],
  render: getRender(__dirname + '/documents.html')
}
