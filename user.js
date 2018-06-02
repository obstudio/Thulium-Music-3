const fs = require('fs')
const path = require('path')
const process = require('process')

class TmUser {
  saveSettings() {
    fs.writeFile(TmUser.userPath + 'settings.json', JSON.stringify(this.settings), {
      encoding: 'utf8'
    })
  }
}

switch (process.platform) {
case 'win32': 
  TmUser.UserPath = path.join(process.env.LOCALAPPDATA, 'Obstudio/Thulium/')
  TmUser.DataPath = path.join(process.env.ALLUSERSPROFILE, 'Obstudio/Thulium/')
  break
default:
  // DO SOMETHING
}

TmUser.Settings = require(TmUser.UserPath + 'settings.json')
TmUser.LangList = require('./languages/index.json')

module.exports = TmUser

