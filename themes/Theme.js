const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const sass = require('sass')

class TmTheme {
  constructor(loadBuffer = false, saveBuffer = false) {
    for (const theme of global.library.Themes) {
      const name = theme.key
      const filepath = path.resolve(__dirname, name)
      if (loadBuffer) {
        this[name] = require(filepath + '.buffer.json')
      } else {
        this[name] = yaml.safeLoad(fs.readFileSync(filepath + '.yaml', { encoding: 'utf8' }))
        if (saveBuffer) {
          fs.writeFileSync(filepath + '.buffer.json', JSON.stringify(this[name]), { encoding: 'utf8' })
        }
      }
      const style = document.createElement('style')
      style.innerHTML = sass.renderSync({ file: filepath + '.scss' }).css.toString()
      document.head.appendChild(style)
    }
  }
}
  
module.exports = new TmTheme()
