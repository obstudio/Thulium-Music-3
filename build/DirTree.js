const fs = require('fs'),
  path = require('path')

module.exports = function dirTree(filename) {
  const stats = fs.lstatSync(filename),
    info = {
      path: filename,
      name: path.basename(filename, '.tmd')
    }
  if (stats.isDirectory()) {
    info.type = 'folder'
    info.children = fs.readdirSync(filename).filter((filename) => {
      return !filename.startsWith('.') && ['', '.tmd'].includes(path.extname(filename))
    }).map((child) => {
      return dirTree(filename + '/' + child)
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
    })
  } else {
    info.type = 'file'
  }
  return info
}
