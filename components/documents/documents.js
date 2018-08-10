const Vue = require('vue')
const open = require('opn')
const SmoothScroll = require('../SmoothScroll')

;[
  'Code', 'List', 'Split', 'Table', 'Textblock',
  'Paragraph', 'Heading', 'Section', 'Blockquote', 'Usage'
].forEach(name => Vue.component(name, require('./components/' + name)))

function getTopLevelText(element) {
  let result = '', child = element.firstChild
  while (child) {
    if (child.nodeType === 3) result += child.data
    child = child.nextSibling
  }
  return result.trim()
}

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
          return this.base + '/' + this.item.name
        },
        active() {
          return this.rootMenu.$parent.current.path === this.index
        }
      },
      props: ['item', 'base'],
      inject: ['switchDoc', 'rootMenu'],
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
    styles() {
      return this.$store.state.Styles
    },
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
    window.monaco.editor.setTheme(this.$store.state.Settings.theme)
    this.docScroll = SmoothScroll(this.$refs.doc, {
      callback: (doc) => {
        this.docScrolled = doc.scrollTop > 0
      }
    })
    this.menuScroll = SmoothScroll(this.$refs.menu, {
      callback: (menu) => {
        this.menuScrolled = menu.scrollTop > 0
      }
    })
  },

  methods: {
    async setContent() {
      // try {
      const doc = await fetch(`./documents${this.current.path}`)
      const text = await doc.text()
      this.root = this.$markdown(text, {
        directory: this.current.path,
        dictionary: this.tree.dictionary
      })
      // } catch (e) {
      //   this.move(-1)
      //   return
      // }
      this.$nextTick(() => {
        const anchorMap = {}
        for (const node of this.$refs.doc.getElementsByTagName('h2')) {
          anchorMap[getTopLevelText(node)] = node
        }
        this.h2nodes = anchorMap
        this.$store.state.Prefix.documents = getTopLevelText(this.$refs.doc.children[0]) + ' - '
      })
    },
    setPosition(smooth = true) {
      if (this.current.recent) {
        delete this.current.recent
        if (this.current.anchor !== null) {
          this.switchToAnchor(this.current.anchor, smooth)
        } else {
          this.docScroll.scrollByPos(0, smooth)
        }
      } else {
        if (typeof this.current.scroll === 'string') {
          this.switchToAnchor(this.current.anchor, smooth)
        } else {
          this.docScroll.scrollByPos(this.current.scroll, smooth)
        }
      }
    },
    loadContent() {
      this.setContent().then(() => this.$nextTick(() => {
        this.setPosition(false)
      })).catch(() => this.$nextTick(() => {
        this.move(-1)
      }))
    },

    resolvePath(url) {
      if (!url.includes('.tmd')) url += '.tmd'
      const docParts = this.current.path.split('/')
      const back = /^(?:\.\.\/)*/.exec(url)[0].length
      docParts.splice(-1 - back / 3, Infinity, url.slice(back))
      return docParts.join('/')
    },

    // only invoked when a link in the document is clicked
    navigate(event) {
      let url = event.srcElement.dataset.rawUrl
      if (!url) return
      if (url.startsWith('$issue#')) {
        open('https://github.com/obstudio/Thulium-Music-3/issues/' + url.slice(7))
      } else if (url.startsWith('#')) {
        this.switchDoc(this.current.path + url)
      } else {
        this.switchDoc(this.resolvePath(url))
      }
    },

    switchToAnchor(text, smooth) {
      if (!text) {
        text = this.current.anchor
      } else {
        this.current.anchor = text
      }
      const result = this.h2nodes[text]
      if (result) {
        this.docScroll.scrollByPos(result.offsetTop, smooth)
      }
    }
  },

  props: ['width', 'height', 'left', 'top'],
  render: getRender(__dirname + '/documents.html')
}
