const fs = require('fs')
const path = require('path')
const process = require('process')

class Thulium {
  saveSettings() {
    fs.writeFile(userPath + 'settings.json', JSON.stringify(this.settings), {
      encoding: 'utf8'
    }, (err) => {
      console.log(err)
    })
  }
}

switch (process.platform) {
  case 'win32': 
    Thulium.UserPath = path.join(process.env.LOCALAPPDATA, 'Obstudio/Thulium/')
    Thulium.DataPath = path.join(process.env.ALLUSERSPROFILE, 'Obstudio/Thulium/')
    break
  default:
    console.log(process.platform)
}

Thulium.Settings = require(Thulium.UserPath + 'settings.json')
Thulium.LangList = require('./lang/index.json')

module.exports = Thulium

