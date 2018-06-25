const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const DEBUG = true
app.on('window-all-closed', function () {
  app.quit()
})

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
  // window.webContents.on('paint', (event, dirty, image) => {
  //   // updateBitmap(dirty, image.getBitmap())
  // })
  // window.webContents.setFrameRate(30)
})