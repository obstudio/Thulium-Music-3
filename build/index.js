const Vue = require('vue')
const YAML = require('js-yaml')
const ElementUI = require('element-ui/lib')
const VueCompiler = require('vue-template-compiler/browser')
// const YAML = require('js-yaml')
const fs = require('fs')
// const {remote} = require('electron')
global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

const Lexer = require('../library/tmdoc/Lexer')
const StructurePath = __dirname + '/../documents/structure.yml'
function read() {
  let structure
  if (fs.existsSync(StructurePath)) {
    structure = YAML.safeLoad(fs.readFileSync(StructurePath, 'utf8'))
    // fs.copyFileSync(StructurePath, StructureBackupPath)
  } else {
    structure = {}
  }
  return structure
}
let structure = read()
fs.watch('documents', {recursive: true}, (event, filename) => {
  // write(structure = dirTree('documents', structure))
  if (filename === 'structure.yml') {
    structure = read()
  }
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
function getTopLevelText(element) {
  let result = '', child = element.firstChild
  while (child) {
    if (child.nodeType === 3) result += child.data
    child = child.nextSibling
  }
  return result.trim()
}
function walk(dirTree, base = '') {
  if (dirTree.type === 'folder' || dirTree.children || dirTree.default) {
    return {
      type: 'folder',
      name: dirTree.name,
      default: dirTree.default || null,
      children: dirTree.children ? dirTree.children.map((sub) => walk(sub, base + dirTree.name + '/')) : []
    }
  } else {
    const name = dirTree.name.endsWith('.tmd') ? dirTree.name : dirTree.name + '.tmd'
    const content = fs.readFileSync(base + name, 'utf8')
    const root = new Lexer().lex(content)
    const vm = new Vue({
      data() {return {root}},
      render: VueCompile(`<div><component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/></div>`)
    })
    vm.$mount()
    const titleNode = vm.$el.getElementsByTagName('h1')[0], title = titleNode ? titleNode.textContent : dirTree.name

    return {
      type: 'file',
      name: dirTree.name.endsWith('.tmd') ? dirTree.name : dirTree.name + '.tmd',
      anchors: Array.prototype.map.call(vm.$el.getElementsByTagName('h2'), (node) => getTopLevelText(node)),
      title
    }
  }
}

function generate() {
  fs.writeFileSync(__dirname + '/structure.json', JSON.stringify(walk(structure)), 'utf8')
}

generate()
