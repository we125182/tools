import { app, BrowserWindow, clipboard, ipcMain } from 'electron'
import { join } from 'node:path'

const isDevelopment = process.argv.includes('--dev')
const developmentServerUrl = 'http://127.0.0.1:5173'

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, 'preload.cjs'),
    },
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (isDevelopment) {
    void window.loadURL(developmentServerUrl)
    window.webContents.openDevTools({ mode: 'detach' })
    return
  }

  void window.loadFile(join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  ipcMain.handle('clipboard:write-text', (_event, text: unknown) => {
    if (typeof text !== 'string') throw new TypeError('Clipboard text must be a string.')
    clipboard.writeText(text)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
