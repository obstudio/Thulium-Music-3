const fs = require('fs')
const path = require('path')
const process = require('process')

class TmLocal {
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
    TmLocal.userPath = path.join(process.env.LOCALAPPDATA, 'Obstudio/Thulium/')
    TmLocal.dataPath = path.join(process.env.ALLUSERSPROFILE, 'Obstudio/Thulium/')
    break
  default:
    console.log(process.platform)
}

TmLocal.settings = require(TmLocal.userPath + 'settings.json')
TmLocal.langList = require('./lang/index.json')

module.exports = TmLocal

