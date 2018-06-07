const yaml = require('js-yaml')
const fs = require('fs')

class TmTheme {
  constructor(loadBuffer = false, saveBuffer = false) {
    for (const theme of TmTheme.$) {
      const name = theme.key
      const path = './themes/' + name
      if (loadBuffer) {
        this[name] = require(path + '.buffer.json')
      } else {
        this[name] = yaml.safeLoad(fs.readFileSync(path + '.yaml', { encoding: 'utf8' }))
        if (saveBuffer) {
          fs.writeFileSync(path + '.buffer.json', JSON.stringify(this[name]), { encoding: 'utf8' })
        }
      }
      const link = document.createElement('link')
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('type', 'text/css')
      link.setAttribute('href', 'themes/' + name + '.css')
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }
}

TmTheme.$ = require('./index.json')
  
const themes = new TmTheme()

module.exports = themes
