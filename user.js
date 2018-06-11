const fs = require('fs')
const path = require('path')
const process = require('process')
const defaultSettings = require('./default.json')

class TmUser {
  constructor() {
    if (!fs.existsSync(TmUser.UserPath + 'settings.json')) {
      if (!fs.existsSync(TmUser.UserPath)) fs.mkdirSync(TmUser.UserPath)
      this.Settings = defaultSettings
      this.saveSettings()
    } else {
      this.Settings = require(TmUser.UserPath + 'settings.json')
    }
    this.Captions = require('./languages/' + this.Settings.language + '/general.json')
    this.Styles = global.themes[this.Settings.theme]
    this.Route = 'homepage'
    this.Prefix = { homepage: '', editor: '', settings: '', documents: '' }
  }

  saveSettings() {
    fs.writeFile(
      TmUser.UserPath + 'settings.json',
      JSON.stringify(this.Settings),
      { encoding: 'utf8' },
      () => {}
    )
  }

  getSetting(key) {
    if (this.Settings[key] === undefined) {
      this.Settings[key] = defaultSettings[key]
    }
    return this.Settings[key]
  }

  setSetting(key, value) {
    this.Settings[key] = value
    this.saveSettings()
  }
}

switch (process.platform) {
case 'win32': 
  TmUser.UserPath = path.join(process.env.LOCALAPPDATA, 'Obstudio/Thulium 3/')
  TmUser.DataPath = path.join(process.env.ALLUSERSPROFILE, 'Obstudio/Thulium 3/')
  TmUser.LineEnding = 'CRLF'
  break
default:
  // DO SOMETHING
}

const user = new TmUser()
user.Settings.lineEnding = TmUser.LineEnding
global.saveSettings = function() {
  fs.writeFile(
    TmUser.UserPath + 'settings.json',
    JSON.stringify(global.user.state.Settings),
    { encoding: 'utf8' },
    () => {}
  )
}

module.exports = {
  state: user,
  mutations: {}
}
