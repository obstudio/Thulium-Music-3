const Vue = require('vue')

Vue.component('Code', require('./Code'))
Vue.component('List', require('./List'))
Vue.component('Split', require('./Split'))
Vue.component('Table', require('./Table'))
Vue.component('Textblock', require('./Textblock'))
Vue.component('Paragraph', require('./Paragraph'))
Vue.component('Heading', require('./Heading'))
Vue.component('Section', require('./Section'))
Vue.component('Blockquote', require('./Blockquote'))

module.exports = {
  name: 'TmDoc',
  components: {
    Document: {
      name: 'Document',
      props: {
        content: {
          type: Array,
          required: true
        }
      },
      render: VueCompile(`<div class="tm-doc">
        <component v-for="(comp, index) in content" :is="comp.type" :node="comp" :key="index"/>
      </div>`)
    },
    TmDocVariant: {
      name: 'TmDocVariant',
      props: ['item', 'base'],
      computed: {
        index() {
          return `${this.base}/${this.item.name || this.item}`
        }
      },
      render: VueCompile(`
      <el-submenu v-if="typeof item === 'object'" :index="index">
        <template slot="title">{{item.name}}</template>
        <tm-doc-variant v-for="sub in item.content" :item="sub" :base="index"></tm-doc-variant>
      </el-submenu>
      <el-menu-item v-else :index="index">
        <span slot="title">{{item}}</span>
      </el-menu-item>`)
    }
  },
  data() {
    return {
      items: require('../../documents/structure.json'),
      root: []
    }
  },
  computed: {
    docHeight() {
      return `${this.height}px`
    }
  },
  props: {
    height: {
      type: Number,
      required: true
    },
    initial: {
      type: String,
      default: '/overview'
    }
  },
  created() {
    this.doc = this.initial
    this.setContent()
  },
  methods: {
    setContent() {
      (async () => {
        const doc = await fetch(`./documents${this.doc}.tmd`)
        const text = await doc.text()
        this.root = this.$markdown(text)
        global.user.state.Prefix.documents = this.root[0].text + ' - '
      })()
    },
    switchDoc(index) {
      this.doc = index
      this.setContent()
    }
  },
  render: VueCompile(`<el-row class="tm-document" style="background-color: white;">
    <el-col :span="7" :style="{height: docHeight}">
      <el-menu style="height: 100%" @select="switchDoc" :unique-opened="true">
        <tm-doc-variant v-for="item in items" :item="item" base=""></tm-doc-variant>
      </el-menu>
    </el-col>
    <el-col :span="16" :offset="1" style="overflow: auto;" :style="{height: docHeight}">
      <Document :content="root"></Document>
    </el-col>
  </el-row>`)
}
