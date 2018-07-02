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
      try {
        const doc = await fetch(`./documents${this.current.path}`)
        const text = await doc.text()
        this.root = this.$markdown(text, {
          directory: this.current.path,
          dictionary: this.tree.dictionary
        })
      } catch (e) {
        this.move(-1)
        return
      }
      this.h2nodes = Array.from(this.$refs.doc.getElementsByTagName('h2'))
      this.$nextTick(() => {
        global.user.state.Prefix.documents = getTopLevelText(this.$refs.doc.children[0]) + ' - '
        if (typeof this.current.scroll === 'string') {
          this.switchToAnchor(this.current.anchor)
        } else {
          this.docScroll.scrollByPos(this.current.scroll)
        }
        this.current.scroll = this.$refs.doc.scrollTop // save scroll info, better way?
      })
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
        if (!docParts[docParts.length - 1].endsWith('.tmd')) {
          docParts[docParts.length - 1] += '.tmd'
        }
        this.switchDoc(docParts.join('/'))
      }
    },
    switchToAnchor(text) {
      if (!text) {
        text = this.current.anchor
      } else {
        this.current.anchor = text
      }
      const result = this.h2nodes.find(node => getTopLevelText(node) === text)
      if (result) {
        this.docScroll.scrollByPos(result.offsetTop)
      }
    }
  },

  props: ['width', 'height', 'left', 'top'],
  render: getRender(__dirname + '/documents.html')
}
