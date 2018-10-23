
const {
  BrowserWindow,
  MenuItem,
  Tray,
  Menu,
  app,
  shell
} = require('electron');
const path = require('path')
const http = require('http')
const fs = require('fs')
const is = require('electron-is')

let __libname = path.join(path.dirname(__dirname), 'lib')
if (is.dev()) {
    __libname = path.join(__dirname, 'mac')
}
const { getConfig } = require(path.join(__libname, 'config.js'))
let mainWindow
let tray
let config = getConfig()
global.config = config
global.is = is
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 360, 
    height: 600, 
    title: config.name,
    titleBarStyle: 'hidden',
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    show: false,
    webPreferences: {
      devTools: is.dev()?true:false,
      preload: path.join(__dirname, 'renderer.js')
    }
  })

  let loadUrl = path.join('file://'+__dirname, 'app/index.html')
  if (is.dev()) {
      loadUrl = 'http://localhost:8002/'
  }
  mainWindow.loadURL(loadUrl)
  mainWindow.webContents.openDevTools()

  mainWindow.on('close', function (event) {
    mainHide()
    event.preventDefault()
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('before-input-event', function(event, input) {
    if (input.meta) {
      if (input.code === 'KeyW') {
        mainHide()
        event.preventDefault()
      }
      if (input.code === 'KeyQ') {
        allQuit()
      }
    }
  })
  global.app = mainWindow
}

function createTray () {
  let iconPath = path.join(__dirname, 'statusBarIconGray.ico')
  if (process.platform == 'darwin'){
    iconPath = path.join(__dirname, 'iconGray@2x.png')
  }
  tray = new Tray(iconPath)
  const menu = new Menu()
  menu.append(new MenuItem({label: '控制台', type: 'normal', click: ()=>{mainShow()}}))
  menu.append(new MenuItem({label: '全局模式', type: 'checkbox', id: 'global'}))
  menu.append(new MenuItem({label: '编辑PAC...', type: 'normal', click: ()=>{shell.showItemInFolder(path.join(__libname, 'pac/proxy.pac'))}}))
  menu.append(new MenuItem({type: 'separator'}))
  menu.append(new MenuItem({label: '退出', type: 'normal', click: ()=>{allQuit()}}))
  tray.setContextMenu(menu)
  global.menu = menu
  global.tray = tray
}

function createHttpSrv(){
  http.createServer(function(req,res){
    if (req.url == '/proxy.pac') {
      let pac = fs.readFileSync(path.join(__libname, 'pac/proxy.pac'))
      res.writeHead(200,{'content-type':'text/plain'});
      res.end(pac);
    }else{
      res.writeHead(404)
      res.end("<h1>404</h1><p>file not found</p>")
    }
  }).listen(9961);
}

function mainShow() {
  mainWindow.show()
  if(process.platform=='darwin'){
    app.dock.show()
  }
}

function mainHide(){
  mainWindow.hide()
  if(process.platform=='darwin'){
    app.dock.hide()
  }
}

function allQuit(){
  mainWindow.webContents.executeJavaScript('if(typeof window.v2rayStop=="function"){ window.v2rayStop(); }', true).then((result) => {mainWindow.destroy()})
}


let shouldQuit = app.makeSingleInstance((argv, workingDir) => {
  mainShow()
  mainWindow.focus()
});

if (shouldQuit) {
    app.exit();
    return;
}

app.on('ready', ()=>{
  createWindow()
  createTray()
  createHttpSrv()
})

app.on('activate', () => {
  mainWindow.focus()
})

app.on('before-quit', () => {
  allQuit()
})

app.on('window-all-closed', function () {
  app.quit()
})

