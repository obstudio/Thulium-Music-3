const Vue = require('vue')
const SmoothScroll = require('../SmoothScroll')
const index = require('../../documents/index.json')
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
      computed: {
        index() {
          return this.base + '/' + 
            (this.item instanceof Array ? this.item : this.item.name)[0]
        }
      },
      render: VueCompile(`
      <el-menu-item v-if="item instanceof Array" :index="index">
        <span slot="title">{{ item[1] }}</span>
      </el-menu-item>
      <el-submenu v-else :index="index">
        <template slot="title">{{ item.name[1] }}</template>
        <tm-doc-variant v-for="sub in item.content" :item="sub" :base="index"/>
      </el-submenu>`)
    }
  },
  data() {
    return {
      items: index,
      doc: '/overview',
      lastDoc: '/overview',
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
  created() {
    window.monaco.editor.setTheme(global.user.state.Settings.theme)
    this.setContent()
  },
  mounted() {
    this.docScroll = SmoothScroll(this.$refs.doc, 100, 10)
    this.menuScroll = SmoothScroll(this.$refs.menu, 100, 10)
  },
  methods: {
    setContent() {
      (async () => {
        try {
          const doc = await fetch(`./documents${this.doc}.tmd`)
          const text = await doc.text()
          this.root = this.$markdown(text)
        } catch (e) {
          this.switchDoc(this.lastDoc)
        }
        global.user.state.Prefix.documents = this.root[0].text + ' - '

        this.docScroll(-this.$refs.doc.scrollTop)
      })()
    },
    switchDoc(index) {
      this.lastDoc = this.doc
      this.doc = defaultDoc[index] ? defaultDoc[index] : index
      this.setContent()
    },
    navigate(e) {
      const url = e.srcElement.dataset.rawUrl
      if (!url) return
      if (url.startsWith('/')) {
        this.switchDoc(url)
      } else {
        const upPart = /^(?:\.\.\/)+/.exec(url)
        const docParts = this.doc.split('/')
        const up = upPart === null ? 1 : upPart[0].length / 3 + 1
        docParts.splice(- up, up, upPart === null ? url : url.slice(upPart[0].length))
        this.switchDoc(docParts.join('/'))
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
        <button @click="">
          <i class="icon-arrow-left"/>
        </button>
        <button @click="">
          <i class="icon-arrow-right"/>
        </button>
        <ul class="route">
          <li v-for="(part, index) in getPath(doc)" :key="index">
            <span v-if="index > 0">/</span>
            <a @click="switchDoc(part.route)">{{ part.title }}</a>
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
        :default-active="doc">
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
