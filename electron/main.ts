import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, Notification, screen } from 'electron'
import { join } from 'node:path'

const isDevelopment = process.argv.includes('--dev')
const developmentServerUrl = 'http://127.0.0.1:5173'
let quickTodoWindow: BrowserWindow | null = null

function getWindowState(window: BrowserWindow) {
  return {
    isFullscreen: window.isFullScreen(),
  }
}

function sendWindowState(window: BrowserWindow) {
  if (!window.isDestroyed()) window.webContents.send('window:state-changed', getWindowState(window))
}

function getEventWindow(webContents: Electron.WebContents) {
  return BrowserWindow.fromWebContents(webContents)
}

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
    title: 'JSON Tools',
    frame: process.platform !== 'darwin',
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
  window.on('enter-full-screen', () => sendWindowState(window))
  window.on('leave-full-screen', () => sendWindowState(window))

  if (isDevelopment) {
    window.webContents.openDevTools({ mode: 'detach' })
  }

  loadWindow(window)
}

function positionQuickTodoWindow(window: BrowserWindow) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const [width] = window.getSize()
  const { x, y, width: workAreaWidth } = display.workArea
  window.setPosition(x + workAreaWidth - width, y)
}

function createQuickTodoWindow() {
  const window = new BrowserWindow({
    width: 620,
    height: 760,
    minWidth: 420,
    minHeight: 480,
    title: '代办任务',
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, 'preload.cjs'),
    },
  })

  quickTodoWindow = window
  window.once('ready-to-show', () => {
    positionQuickTodoWindow(window)
    window.show()
  })
  window.on('closed', () => {
    if (quickTodoWindow === window) quickTodoWindow = null
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  loadWindow(window, '/todos/quick')
}

function toggleQuickTodoWindow() {
  if (!quickTodoWindow || quickTodoWindow.isDestroyed()) {
    createQuickTodoWindow()
    return
  }

  if (quickTodoWindow.isVisible()) {
    quickTodoWindow.hide()
    return
  }

  positionQuickTodoWindow(quickTodoWindow)
  quickTodoWindow.show()
  quickTodoWindow.focus()
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
  ipcMain.handle('window:get-state', (event) => {
    const window = getEventWindow(event.sender)
    if (!window) throw new Error('Window not found.')
    return getWindowState(window)
  })
  ipcMain.handle('window:minimize', (event) => {
    getEventWindow(event.sender)?.minimize()
  })
  ipcMain.handle('window:toggle-fullscreen', (event) => {
    const window = getEventWindow(event.sender)
    if (!window) return
    window.setFullScreen(!window.isFullScreen())
  })
  ipcMain.handle('window:close', (event) => {
    getEventWindow(event.sender)?.close()
  })

  createWindow()
  globalShortcut.register('Control+N', toggleQuickTodoWindow)

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
