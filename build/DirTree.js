const fs = require('fs'),
  path = require('path'),
  YAML = require('js-yaml'),
  DocumentDir = 'documents',
  StructurePath = __dirname + '/structure.yml',
  StructureBackupPath = __dirname + '/structure.back.yml'

function dirTree(filename, structure) {
  if (structure.type !== undefined && path.basename(filename) !== structure.name) throw new Error('Mismatch')
  const stats = fs.lstatSync(filename),
    isEmptyStructure = structure.type === undefined,
    info = {
      path: filename,
      name: path.basename(filename)
    }
  if (stats.isDirectory()) {
    info.type = 'folder'
    const names = fs.readdirSync(filename).filter((filename) => {
      return !filename.startsWith('.') && ['', '.tmd'].includes(path.extname(filename))
    })
    if (isEmptyStructure) {
      info.children = names.map((child) => {
        return dirTree(filename + '/' + child, {})
      }).sort((treeA, treeB) => {
        if (treeA.type === treeB.type) {
          if (treeA.name === 'overview.tmd') return -1
          if (treeB.name === 'overview.tmd') return 1
          return treeA.name < treeB.name ? -1 : 1
        } else if (treeA.type === 'file'){
          return -1
        } else {
          return 1
        }
      })
    } else {
      info.children = structure.children.filter((child) => {
        if (names.includes(child.name)) {
          names.splice(names.indexOf(child.name), 1)
          return true
        }
        return false
      }).map((child) => dirTree(child.path, child)).concat(names.map((name) => {
        const exist = structure.children.find((child) => child.name === name && child.type === 'folder')
        if (exist === undefined)
          return dirTree(filename + '/' + name, {})
        else
          return dirTree(filename + '/' + name, exist)
      }).sort((treeA, treeB) => {
        if (treeA.type === treeB.type) {
          if (treeA.name === 'overview') return -1
          if (treeB.name === 'overview') return 1
          return treeA.name < treeB.name ? -1 : 1
        } else if (treeA.type === 'file'){
          return -1
        } else {
          return 1
        }
      }))
    }
  } else {
    info.type = 'file'
  }

  return info
}

function io() {
  let structure
  if (fs.existsSync(StructurePath)) {
    structure = YAML.safeLoad(fs.readFileSync(StructurePath, 'utf8'))
    fs.renameSync(StructurePath, StructureBackupPath)
  } else {
    structure = {}
  }
  fs.writeFileSync(StructurePath, YAML.safeDump(dirTree(DocumentDir, structure)), 'utf8')
}

io()
