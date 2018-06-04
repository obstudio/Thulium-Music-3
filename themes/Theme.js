const yaml = require('js-yaml')
const fs = require('fs')

class TmTheme {
  constructor(loadBuffer = false, saveBuffer = false) {
    for (const theme of TmTheme.$themes) {
      const path = './themes/' + theme
      if (loadBuffer) {
        this[theme] = require(path + '.buffer.json')
      } else {
        this[theme] = yaml.safeLoad(fs.readFileSync(path + '.yaml', { encoding: 'utf8' }))
        if (saveBuffer) {
          fs.writeFileSync(path + '.buffer.json', JSON.stringify(this[theme]), { encoding: 'utf8' })
        }
      }
      window.monaco.editor.defineTheme(theme, {
        base: this[theme].basetheme,
        inherit: true,
        rules: this[theme].tokenizer,
        colors: {}
      })
      const link = document.createElement('link')
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('type', 'text/css')
      link.setAttribute('href', 'themes/' + theme + '.css')
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }
}

TmTheme.$themes = require('./index.json')
  
module.exports = new TmTheme()
