const {app, Menu, Tray, BrowserWindow, webFrame} = require('electron')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let trayIcon

async function initialization() {
  trayIcon = new Tray('./assets/logo.ico')
  trayIcon.setToolTip('Thulium Music')
  trayIcon.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Thulium'
    },
    {
      type: 'separator'
    },
    {
      label: '开发者工具',
      click: () => {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools()
        } else {
          mainWindow.webContents.openDevTools()
        }
      }
    },
    {
      label: '退出',
      role: 'quit'
    }
  ]))
  
  trayIcon.on('click', () => {
    mainWindow.show()
  })

  // For test
  return new Promise(resolve => {
    setTimeout(() => resolve(20), 2000)
  })
}

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    transparent: true
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async function() {
  const loadingWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    resizable: false,
    movable: false
  })

  loadingWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'load.html'),
    protocol: 'file:',
    slashes: true
  }))

  await initialization()

  createMainWindow()

  mainWindow.once('ready-to-show', () => {
    loadingWindow.destroy()
    mainWindow.show()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow()
  }
})


