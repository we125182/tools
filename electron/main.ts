import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, Notification } from 'electron'
import { join } from 'node:path'

const isDevelopment = process.argv.includes('--dev')
const developmentServerUrl = 'http://127.0.0.1:5173'

function loadWindow(window: BrowserWindow, hash?: string) {
  if (isDevelopment) {
    void window.loadURL(`${developmentServerUrl}${hash ? `/#${hash}` : ''}`)
    return
  }

  void window.loadFile(join(__dirname, '..', 'dist', 'index.html'), hash ? { hash } : undefined)
}

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
    window.webContents.openDevTools({ mode: 'detach' })
  }

  loadWindow(window)
}

function createQuickTodoWindow() {
  const window = new BrowserWindow({
    width: 620,
    height: 760,
    minWidth: 420,
    minHeight: 480,
    title: '代办任务',
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
  loadWindow(window, '/todos/quick')
}

app.whenReady().then(() => {
  ipcMain.handle('clipboard:write-text', (_event, text: unknown) => {
    if (typeof text !== 'string') throw new TypeError('Clipboard text must be a string.')
    clipboard.writeText(text)
  })
  ipcMain.handle('notification:show', (_event, title: unknown, body: unknown) => {
    if (typeof title !== 'string' || typeof body !== 'string') throw new TypeError('Notification content must be strings.')
    if (Notification.isSupported()) new Notification({ title, body }).show()
  })

  createWindow()
  globalShortcut.register('Control+N', createQuickTodoWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregister('Control+N')
})
