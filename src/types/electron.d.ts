export {}

declare global {
  interface Window {
    electronAPI?: {
      writeClipboard: (text: string) => Promise<void>
      showNotification: (title: string, body: string) => Promise<void>
    }
  }
}
