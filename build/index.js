const Vue = require('vue')
const path = require('path')
const YAML = require('js-yaml')
const { ipcRenderer } = require('electron')
const ElementUI = require('element-ui/lib')
const VueCompiler = require('vue-template-compiler/browser')
const fs = require('fs')
global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}

const Lexer = require('../library/tmdoc/Lexer')
const basePath = path.join(__dirname, '/../')
const indexPath = __dirname + '/../documents/index.yml'

function read() {
  let structure
  if (fs.existsSync(indexPath)) {
    structure = YAML.safeLoad(fs.readFileSync(indexPath, 'utf8'))
  } else {
    structure = {}
  }
  return structure
}
let structure = read()
fs.watch('documents', {recursive: true}, () => {
  // write(structure = dirTree('documents', structure))
  generate(structure)
})
fs.watch(indexPath, () => {
  structure = read()
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
  if (dirTree.children) {
    return {
      type: 'folder',
      name: dirTree.name,
      title: dirTree.title || dirTree.name,
      default: dirTree.default || (dirTree.children.find(sub => sub.name === 'overview') ? 'overview' : null),
      children: dirTree.children.map(sub => walk(sub, base + dirTree.name + '/'))
    }
  } else {
    const name = dirTree.name + '.tmd'
    const content = fs.readFileSync(basePath + base + name, 'utf8')
    const root = new Lexer().lex(content)
    const vm = new Vue({
      data() {return {root}},
      render: VueCompile(`<div><component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/></div>`)
    })
    vm.$mount()
    const titleNode = vm.$el.getElementsByTagName('h1')[0]

    return {
      type: 'file',
      name: dirTree.name.endsWith('.tmd') ? dirTree.name : dirTree.name + '.tmd',
      anchors: Array.prototype.map.call(vm.$el.getElementsByTagName('h2'), getTopLevelText),
      title: titleNode ? getTopLevelText(titleNode) : dirTree.name
    }
  }
}

function generate() {
  fs.writeFileSync(__dirname + '/structure.json', JSON.stringify(walk(structure)), 'utf8')
}

generate()

ipcRenderer.send('build-done')
