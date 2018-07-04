const fs = require('fs')
const path = require('path')
const defaultSettings = require(`./${process.platform}.json`)
let UserPath, DataPath, SettingsPath

function buildPath(base, ...sections) {
  let dir = base
  for (const section of sections) {
    dir = path.join(dir, section)
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fs.mkdirSync(dir)
  }
  return dir
}

switch (process.platform) {
  case 'win32': {
    UserPath = buildPath(process.env.LOCALAPPDATA, 'Obstudio', 'Thulium 3')
    SettingsPath = path.join(UserPath, 'settings.json')
    DataPath = buildPath(process.env.ALLUSERSPROFILE, 'Obstudio', 'Thulium 3')
    break
  }
  case 'linux':
    // Do something
    break
  case 'darwin':
    // Do something
}

function saveSettings(settings) {
  fs.writeFile(SettingsPath, JSON.stringify(settings), (err) => {
    if (err) console.error(err)
  })
}

const user = {}
if (!fs.existsSync(SettingsPath)) {
  user.Settings = defaultSettings
  saveSettings(defaultSettings)
} else {
  user.Settings = require(SettingsPath)
}
user.Styles = global.themes[user.Settings.theme]
user.Prefix = { homepage: '', editor: '', settings: '', documents: '' }

module.exports = {
  state: user,
  mutations: {
    saveSettings(state) {
      saveSettings(state.Settings)
    }
  }
}
