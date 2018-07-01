const Vue = require('vue')
const ElementUI = require('element-ui/lib')
const VueCompiler = require('vue-template-compiler/browser')
// const YAML = require('js-yaml')
const fs = require('fs')
// const {remote} = require('electron')
global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

const Lexer = require('../library/tmdoc/DocLexer')

const {dirTree, read, write, StructurePath} = require('./DirTree')
let structure = read()
fs.watch('documents', {recursive: true}, () => {
  write(structure = dirTree('documents', structure))
})
fs.watch(StructurePath, () => {
  generate(structure)
})

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

function walk(dirTree) {
  if (dirTree.type === 'file') {
    const content = fs.readFileSync(dirTree.path, 'utf8')
    const root = new Lexer().lex(content)
    const vm = new Vue({
      data() {return {root}},
      render: VueCompile(`<div><component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/></div>`)
    })
    vm.$mount()
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
      default: fs.existsSync(__dirname + '/' + dirTree.path + '/overview.tmd') ? 'overview' : null,
      content: dirTree.children.map(walk)
    }
  }
}

function generate() {
  fs.writeFileSync(__dirname + '/structure.json', JSON.stringify(walk(structure)), 'utf8')
}

generate()
