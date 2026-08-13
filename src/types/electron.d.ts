export {}

declare global {
  interface Window {
    electronAPI?: {
      writeClipboard: (text: string) => Promise<void>
    }
  }
}
