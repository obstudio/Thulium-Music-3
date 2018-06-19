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
      functional: true,
      props: {
        content: {
          type: Array,
          required: true
        }
      },
      render: (createElement, context) => {
        return createElement('div', {
          class: {
            'tm-doc': true
          }
        },
        context.props.content.map((comp, index) => createElement(comp.type, {
          props: {
            node: comp
          },
          key: index
        }))
        )
      }
    },
    TmDocVariant: {
      name: 'TmDocVariant',
      functional: true,
      props: ['item', 'base'],
      computed: {
        index() {
          return `${this.base}/${this.item.name || this.item}`
        }
      },
      render: (createElement, context) => {
        const item = context.props.item
        const base = context.props.base
        const index = `${base}/${item.name || item}`
        return typeof item === 'object' ? createElement('el-submenu', {
          props: {
            index
          }
        }, [createElement('template', {
          slot: 'title'
        }, item.name
        ), ...item.content.map((sub) => createElement('tm-doc-variant', {
          props: {
            item: sub,
            base: index
          }
        }))]
        ) : createElement('el-menu-item', {
          props: {
            index
          }
        }, [createElement('span', {
          slot: 'title'
        }, item)])
      }
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
  render: VueCompile(`<el-row class="tm-document">
    <el-col :lg="4" :md="5" :sm="7" :xs="8" :style="{height: docHeight}">
      <el-menu background-color="#363636" text-color="#fff" style="height: 100%; overflow-x: hidden;overflow-y: auto;" @select="switchDoc" :unique-opened="true">
        <tm-doc-variant v-for="item in items" :item="item" base=""></tm-doc-variant>
      </el-menu>
    </el-col>
    <el-col :lg="19" :md="18" :sm="16" :xs="15" :offset="1" style="overflow: auto;" :style="{height: docHeight}">
      <Document :content="root"></Document>
    </el-col>
  </el-row>`)
}
