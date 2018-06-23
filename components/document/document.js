const Vue = require('vue')
const Vuex = require('vuex')
const SmoothScroll = require('../SmoothScroll')
const index = require('../../documents/index.json')
const History = require('./History')
const dictionary = {}
const defaultDoc = {}

function walk(index, base = '') {
  for (const item of index) {
    if (item instanceof Array) {
      dictionary[base + '/' + item[0]] = item[1]
    } else {
      const path = base + '/' + item.name[0]
      walk(item.content, path)
      dictionary[path] = item.name[1]
      defaultDoc[path] = path + '/' + item.default
    }
  }
}

walk(index)

Vue.component('Code', require('./Code'))
Vue.component('List', require('./List'))
Vue.component('Split', require('./Split'))
Vue.component('Table', require('./Table'))
Vue.component('Textblock', require('./Textblock'))
Vue.component('Paragraph', require('./Paragraph'))
Vue.component('Heading', require('./Heading'))
Vue.component('Section', require('./Section'))
Vue.component('Blockquote', require('./Blockquote'))
Vue.component('Usage', require('./Usage'))

module.exports = {
  name: 'TmDoc',
  components: {
    TmDocVariant: {
      name: 'TmDocVariant',
      props: ['item', 'base'],
      inject: ['switchDoc'],
      computed: {
        index() {
          return this.base + '/' + 
            (this.item instanceof Array ? this.item : this.item.name)[0]
        },
        path() {
          return this.$store.state.path
        }
      },
      render: VueCompile(`
      <el-submenu v-if="!(item instanceof Array)" :index="index">
        <template slot="title">{{ item.name[1] }}</template>
        <tm-doc-variant v-for="sub in item.content" :item="sub" :base="index"/>
      </el-submenu>
      <el-submenu v-else-if="index === $store.state.path" :index="index">
        <template slot="title">{{ item[1] }}</template>
        <el-menu-item v-for="anchor in $store.state.anchors" :index="index + '#' + anchor">
          <span slot="title">{{ anchor }}</span>
        </el-menu-item>
      </el-submenu>
      <el-menu-item v-else :index="index">
        <span slot="title">{{ item[1] }}</span>
      </el-menu-item>`)
    }
  },
  store: new Vuex.Store({
    state: {
      path: '/overview',
      anchors: []
    }
  }),
  data() {
    return {
      items: index,
      state: {
        path: '/overview',
        anchor: null,
        scroll: 0
      },
      openedMenu: [],
      root: [],
      catalog: false,
      search: false
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
      return this.state.anchor ? `${this.state.path}#${this.state.anchor}` : this.state.path
    }
  },
  props: {
    height: {
      type: Number,
      required: true
    },
    width: {
      type: Number,
      required: true
    }
  },
  provide() {
    return {
      switchDoc: this.switchDoc
    }
  },
  created() {
    window.monaco.editor.setTheme(global.user.state.Settings.theme)
    const onStateChange = async (state) => {
      this.state = state
      await this.setContent()
      this.$nextTick(() => {
        this.$store.state.path = state.path
        const nodes = this.$refs.doc.getElementsByTagName('h2')
        this.$store.state.anchors = Array.prototype.map.call(nodes, node => node.textContent)
      })
    }
    this.history = new History(onStateChange)
    this.history.pushState(this.state)
  },
  mounted() {
    this.docScroll = SmoothScroll(this.$refs.doc, 100, 10)
    this.menuScroll = SmoothScroll(this.$refs.menu, 100, 10)
  },
  methods: {
    setContent() {
      return (async () => {
        try {
          const doc = await fetch(`./documents${this.state.path}.tmd`)
          const text = await doc.text()
          this.root = this.$markdown(text)
        } catch (e) {
          this.history.back()
          return
        }
        global.user.state.Prefix.documents = this.root[0].text + ' - '
        const scroll = this.$refs.doc.scrollTop
        this.$nextTick(() => {
          if (typeof this.state.scroll === 'string') {
            this.switchToAnchor(this.state.anchor)
          } else {
            this.docScroll(this.state.scroll - scroll)
          }
          const parts = this.state.path.match(/\/[^/]+/g)
          let last = ''
          const arr = []
          for (const part of parts) {
            last += part
            arr.push(last)
          }
          this.openedMenu = arr
        })
      })()
    },
    saveScrollInfo() {
      this.history.current.scroll = this.$refs.doc.scrollTop  // save scroll info, better way?
    },
    switchDoc(index) {
      this.saveScrollInfo()
      const anchor = index.match(/#(.+)$/)
      if (anchor) index = index.slice(0, anchor.index)
      const state = {
        path: defaultDoc[index] || index,
        anchor: anchor ? anchor[1] : null,
        scroll: anchor ? anchor[1] : 0
      }
      this.history.pushState(state)
    },
    back() {
      this.saveScrollInfo()
      this.history.back()
    },
    forward() {
      this.saveScrollInfo()
      this.history.forward()
    },
    navigate(event) {
      let url = event.srcElement.dataset.rawUrl
      if (!url) return
      if (url.startsWith('#')) {
        this.switchDoc(this.state.path + url)
      } else {
        const docParts = this.state.path.split('/')
        const back = /^(?:\.\.\/)*/.exec(url)[0].length
        docParts.splice(-1 - back / 3, Infinity, url.slice(back))
        this.switchDoc(docParts.join('/'))
      }
    },
    switchToAnchor(text) {
      if (!text) {
        text = this.state.anchor
      } else {
        this.state.anchor = text
      }
      const nodes = this.$refs.doc.getElementsByTagName('h2')
      const result = Array.prototype.find.call(nodes, (node) => node.textContent === text)
      if (result) {
        this.docScroll(result.offsetTop - this.$refs.doc.scrollTop)
      }
    },
    getPath(route) {
      const result = []
      let pointer = 0, index
      while ((index = route.slice(pointer + 1).search('/')) !== -1) {
        pointer += index + 1
        const base = route.slice(0, pointer)
        result.push({
          route: base,
          title: dictionary[base]
        })
      }
      result.push({
        route: route,
        title: dictionary[route]
      })
      return result
    }
  },
  render: VueCompile(`<div class="tm-document">
    <div class="toolbar" :style="{ width: width + 'px' }">
      <div class="left">
        <button @click="catalog = !catalog" :class="{ active: catalog }">
          <i class="icon-menu"/>
        </button>
        <button @click="back">
          <i class="icon-arrow-left"/>
        </button>
        <button @click="forward">
          <i class="icon-arrow-right"/>
        </button>
        <ul class="route">
          <li v-for="(part, index) in getPath(state.path)" :key="index">
            <span v-if="index > 0">/</span>
            <a @click="switchDoc(part.route)">{{ part.title }}</a>
          </li>
          <li v-if="state.anchor" class="anchor">
            <span>#</span>
            <a @click="switchDoc(state.path + '#' + state.anchor)">{{ state.anchor }}</a>
          </li>
        </ul>
      </div>
      <div class="right">
        <button @click="search = true">
          <i class="icon-search"/>
        </button>
      </div>
    </div>
    <div class="catalog" :style="{
        height: height - 36 + 'px',
        left: catalog ? '0px' : - catalogWidth + 'px',
        width: catalogWidth + 'px'
      }" ref="menu" @mousewheel.prevent.stop="menuScroll($event.deltaY)">
      <el-menu @select="switchDoc" :unique-opened="true"
        :background-color="styles.documents.navBackground"
        :text-color="styles.documents.navForeground"
        :active-text-color="styles.documents.navActive"
        :default-active="activeIndex"
        :default-openeds="openedMenu">
        <tm-doc-variant v-for="item in items" :item="item" base=""/>
      </el-menu>
    </div>
    <div class="content" :style="{
        height: height - 36 + 'px',
        left: catalog ? catalogWidth + 'px' : '0px',
        width: contentWidth + 'px'
      }">
      <div class="tm-doc" ref="doc" @click.stop="navigate"
        @mousewheel.prevent.stop="docScroll($event.deltaY)"
        :style="{
          'padding-left': Math.max(24, contentWidth / 8) + 'px',
          'padding-right': Math.max(24, contentWidth / 8) + 'px'
        }">
        <component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/>
      </div>
    </div>
  </div>`)
}
