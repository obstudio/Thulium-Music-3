const fs = require('fs')
const path = require('path')
const process = require('process')
const defaultSettings = require('./default.json')

global.library = {}
global.library.Languages = require('./languages/index.json')
global.library.Themes = require('./themes/index.json')

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
  break
default:
  // DO SOMETHING
}

const user = new TmUser()

module.exports = {
  state: user,
  mutations: {}
}
