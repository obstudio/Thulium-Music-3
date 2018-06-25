const Vue = require('vue')
const ElementUI = require('element-ui/lib')
const VueCompiler = require('vue-template-compiler/browser')
const fs = require('fs')
const {remote} = require('electron')
global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

const Lexer = require('../library/tmdoc/Lexer')
// const DirTree = require('./DirTree')
// const DocumentDir = __dirname + '/../documents'
// fs.writeFileSync('structure.json', JSON.stringify(DirTree(DocumentDir)), 'utf8')
;[
  'Code', 'List', 'Split', 'Table', 'Textblock',
  'Paragraph', 'Heading', 'Section', 'Blockquote', 'Usage'
].forEach(name => Vue.component(name, require('../components/documents/components/' + name)))

Vue.use(ElementUI)
Vue.config.productionTip = false

window.monaco = {
  editor: {
    async colorize(code) {
      return code
    }
  }
}
function terminate() {
  remote.getCurrentWindow().close()
}

function walk(dirTree) {
  if (dirTree.type === 'file') {
    const content = fs.readFileSync(__dirname + '/' + dirTree.path, 'utf8')
    const root = new Lexer().lex(content)
    const vm = new Vue({
      data() {
        return {
          root
        }
      },
      render: VueCompile(`<div>
      <component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/>
    </div>`)
    })
    vm.$mount()
    console.log(vm.$el)
    const titleNode = vm.$el.getElementsByTagName('h1')[0], title = titleNode ? titleNode.textContent : dirTree.name

    return {
      type: 'file',
      name: dirTree.name,
      anchors: Array.prototype.map.call(vm.$el.getElementsByTagName('h2'), (node) => node.textContent),
      title
    }
  } else {
    return {
      type: 'folder',
      name: dirTree.name,
      default: 'overview',
      content: dirTree.children.map(walk)
    }
  }
}
console.log(walk(require('./structure.json')))

// new Vue({
//   data() {
//     return {
//       root: []
//     }
//   },
//   mounted() {
//
//   },
//   render: VueCompile(`<div>
//   <component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/>
// </div>`)
// }).mount()
