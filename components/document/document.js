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
    styles: () => global.user.state.Styles
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
    this.doc = '/overview'
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
  render: VueCompile(`<div class="tm-document">
    <div class="index" :style="{height: height + 'px', top: '0px', left: '0px', width: '200px'}">
      <el-menu @select="switchDoc" :unique-opened="true"
        :background-color="styles.documents.navBackground"
        :text-color="styles.documents.navForeground"
        :active-text-color="styles.documents.navActive">
        <tm-doc-variant v-for="item in items" :item="item" base=""/>
      </el-menu>
    </div>
    <div class="content" :style="{height: height + 'px', top: '0px', left: '200px', width: width - 200 + 'px'}">
      <div class="tm-doc">
        <component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/>
      </div>
    </div>
  </div>`)
}
