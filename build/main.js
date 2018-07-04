const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const DEBUG = true

let window

app.once('ready', () => {
  window = new BrowserWindow({
    webPreferences: {
      offscreen: !DEBUG
    },
    show: DEBUG
  })

  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
})

app.on('window-all-closed', function () {
  app.quit()
})

ipcMain.on('build-done', () => {
  if (!DEBUG) app.quit()
})