import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write-text', text),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('notification:show', title, body),
  windowControls: {
    getState: () => ipcRenderer.invoke('window:get-state'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    close: () => ipcRenderer.invoke('window:close'),
    onStateChange: (callback: (state: { isFullscreen: boolean }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: { isFullscreen: boolean }) => callback(state)
      ipcRenderer.on('window:state-changed', listener)
      return () => ipcRenderer.removeListener('window:state-changed', listener)
    },
  },
})
