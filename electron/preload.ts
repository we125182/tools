import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write-text', text),
})
