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
        <component v-for="(comp, index) in content" :is="comp.type" :node="comp" :key="index"></component>
      </div>`)
    }
  },
  data() {
    return {
      items: ['overview', 'API/API', 'Ammonia/Key'],
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
      default: 'overview'
    }
  },
  created() {
    this.doc = this.initial
    this.setContent()
  },
  methods: {
    setContent() {
      (async () => {
        const doc = await fetch(`./documents/${this.doc}.tmd`)
        const text = await doc.text()
        this.root = this.$markdown(text)
      })()
    },
    switchDoc(index) {
      this.doc = index
      this.setContent()
    }
  },
  render: VueCompile(`<el-row class="tm-document">
  <el-col :span="6" :style="{height: docHeight}">
    <el-menu style="height: 100%" @select="switchDoc">
      <el-menu-item v-for="item in items" :key="item" :index="item">
        <i class="el-icon-menu"></i>
        <span slot="title">{{item}}</span>
      </el-menu-item>
    </el-menu>
  </el-col>
  <el-col :span="17" :offset="1" style="overflow: auto;" :style="{height: docHeight}">
    <Document :content="root"></Document>
  </el-col>
</el-row>`)
}
