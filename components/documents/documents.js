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
    if (child.nodeType == 3) result += child.data
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
        const doc = await fetch(`./documents${this.current.path}.tmd`)
        const text = await doc.text()
        this.root = this.$markdown(text)
      } catch (e) {
        this.move(-1)
        return
      }
      const scroll = this.$refs.doc.scrollTop
      this.h2nodes = Array.from(this.$refs.doc.getElementsByTagName('h2'))
      this.$nextTick(() => {
        global.user.state.Prefix.documents = getTopLevelText(this.$refs.doc.children[0]) + ' - '
        if (typeof this.current.scroll === 'string') {
          this.switchToAnchor(this.current.anchor)
        } else {
          this.docScroll(this.current.scroll - scroll)
        }
<<<<<<< HEAD
        global.user.state.Prefix.documents = this.root[0].text + ' - '
        this.$nextTick(() => {
          if (typeof this.current.scroll === 'string') {
            this.switchToAnchor(this.current.anchor)
          } else {
            this.docScroll.scrollByPos(this.current.scroll)
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
=======
        this.current.scroll = this.$refs.doc.scrollTop // save scroll info, better way?
      })
>>>>>>> build-doc
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
      const result = this.h2nodes.find(node => getTopLevelText(node) === text)
      if (result) {
        this.docScroll.scrollByPos(result.offsetTop)
      }
    }
  },
  
  props: ['width', 'height', 'left', 'top'],
<<<<<<< HEAD
  render: VueCompile(`<div class="tm-document"
    @click="hideContextMenus" @contextmenu="hideContextMenus">
    <div class="toolbar" :style="{ width: width + 'px' }">
      <div class="left">
        <button @click="catalog = !catalog" :class="{ active: catalog }">
          <i class="icon-menu"/>
        </button>
        <button @click="move(-1)">
          <i class="icon-arrow-left"/>
        </button>
        <button @click="move(1)">
          <i class="icon-arrow-right"/>
        </button>
        <ul class="route">
          <li v-for="(part, index) in getPath(current.path)" :key="index">
            <span v-if="index > 0">/</span>
            <a @click="switchDoc(part.route)">{{ part.title }}</a>
          </li>
          <li v-if="current.anchor" class="anchor">
            <span>#</span>
            <a @click="switchDoc(current.path + '#' + current.anchor)">{{ current.anchor }}</a>
          </li>
        </ul>
      </div>
      <div class="right">
        <button @click.stop="search = true">
          <i class="icon-search"/>
        </button>
        <button @click.stop="showButtonMenu('history', $event)">
          <i class="icon-history"/>
        </button>
      </div>
    </div>
    <div class="catalog" :style="{
        height: height - 36 + 'px',
        left: catalog ? '0px' : - catalogWidth + 'px',
        width: catalogWidth + 'px'
      }" ref="menu" @mousewheel.prevent.stop="menuScroll.scrollByDelta($event.deltaY)">
      <el-menu @select="switchDoc" :unique-opened="true" ref="elMenu"
        :background-color="styles.documents.navBackground"
        :text-color="styles.documents.navForeground"
        :active-text-color="styles.documents.navActive"
        :default-active="activeIndex">
        <tm-doc-variant v-for="item in docIndex" :item="item" base=""/>
      </el-menu>
    </div>
    <div class="content" :style="{
        height: height - 36 + 'px',
        left: catalog ? catalogWidth + 'px' : '0px',
        width: contentWidth + 'px'
      }">
      <div class="tm-doc" ref="doc" @click="navigate"
        @mousewheel.prevent.stop="docScroll.scrollByDelta($event.deltaY)"
        :class="{ scrolled: docScrolled }" :style="{
          'padding-left': Math.max(24, contentWidth / 8) + 'px',
          'padding-right': Math.max(24, contentWidth / 8) + 'px'
        }">
        <component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/>
      </div>
    </div>
    <tm-menus ref="menus" :keys="menuKeys" :data="menuData" :lists="[{
      name: 'recent',
      data: getRecent(10),
      switch: 'switchTo',
      close: 'deleteAt'
    }]"/>
  </div>`)
=======
  render: getRender(__dirname + '/documents.html')
>>>>>>> build-doc
}
