export {}

declare global {
  interface Window {
    electronAPI?: {
      platform: NodeJS.Platform
      writeClipboard: (text: string) => Promise<void>
      showNotification: (title: string, body: string) => Promise<void>
      windowControls: {
        getState: () => Promise<{ isFullscreen: boolean }>
        minimize: () => Promise<void>
        toggleFullscreen: () => Promise<void>
        close: () => Promise<void>
        onStateChange: (callback: (state: { isFullscreen: boolean }) => void) => () => void
      }
    }
  }
}
