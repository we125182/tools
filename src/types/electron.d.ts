export {}

declare global {
  interface Window {
    electronAPI?: {
      writeClipboard: (text: string) => Promise<void>
      showNotification: (title: string, body: string) => Promise<void>
      windowControls: {
        getState: () => Promise<{ isFullscreen: boolean; isMaximized: boolean }>
        minimize: () => Promise<void>
        toggleMaximize: () => Promise<void>
        close: () => Promise<void>
        onStateChange: (callback: (state: { isFullscreen: boolean; isMaximized: boolean }) => void) => () => void
      }
    }
  }
}
