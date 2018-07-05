const fs = require('fs')
const path = require('path')
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
  case 'win32': {
    const userParentPath = path.join(process.env.LOCALAPPDATA, 'Obstudio/')
    TmUser.UserPath = path.join(userParentPath, 'Thulium 3/')
    if (!fs.existsSync(userParentPath)) fs.mkdirSync(userParentPath)
    if (!fs.existsSync(TmUser.UserPath)) fs.mkdirSync(TmUser.UserPath)
    const dataParentPath = path.join(process.env.ALLUSERSPROFILE, 'Obstudio/')
    TmUser.DataPath = path.join(dataParentPath, 'Thulium 3/')
    if (!fs.existsSync(dataParentPath)) fs.mkdirSync(dataParentPath)
    if (!fs.existsSync(TmUser.DataPath)) fs.mkdirSync(TmUser.DataPath)
    TmUser.LineEnding = 'CRLF'
    break
  }
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
    (err) => {
      if (err) {
        console.error(err)
      }
    }
  )
}

module.exports = {
  state: user,
  mutations: {}
}
