const yaml = require('js-yaml')
const fs = require('fs')

class TmTheme {
  constructor(theme, loadBuffer = false, saveBuffer = false) {
    const path = './themes/' + theme
    if (loadBuffer) {
      Object.assign(this, require(path + '.buffer.json'))
    } else {
      Object.assign(this, yaml.safeLoad(fs.readFileSync(path + '.yaml', { encoding: 'utf8' })))
      if (saveBuffer) {
        fs.writeFileSync(path + '.buffer.json', JSON.stringify(this), { encoding: 'utf8' })
      }
    }
  }
}
  
module.exports = new TmTheme('dark')
