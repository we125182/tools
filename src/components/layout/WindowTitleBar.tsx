import { Braces, Maximize2, Minimize2, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

type WindowState = {
  isFullscreen: boolean
  isMaximized: boolean
}

const initialWindowState: WindowState = {
  isFullscreen: false,
  isMaximized: false,
}

export function WindowTitleBar() {
  const [windowState, setWindowState] = useState(initialWindowState)
  const controls = window.electronAPI?.windowControls

  useEffect(() => {
    if (!controls) return

    let mounted = true
    void controls.getState().then((state) => {
      if (mounted) setWindowState(state)
    })

    return () => {
      mounted = false
    }
  }, [controls])

  useEffect(() => {
    if (!controls) return
    return controls.onStateChange(setWindowState)
  }, [controls])

  if (!controls || windowState.isFullscreen) return null

  return (
    <header className="electron-titlebar flex h-9 shrink-0 items-center border-b bg-background text-muted-foreground">
      <div className="flex min-w-0 items-center gap-2 px-3">
        <Braces size={15} aria-hidden="true" />
        <span className="truncate text-xs font-medium">JSON Tools</span>
      </div>
      <div className="electron-titlebar-controls ml-auto flex h-full shrink-0" role="toolbar" aria-label="窗口控制">
        <Tooltip content="最小化">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-11 rounded-none"
            aria-label="最小化"
            onClick={() => void controls.minimize()}
          >
            <Minimize2 size={15} />
          </Button>
        </Tooltip>
        <Tooltip content={windowState.isMaximized ? '还原窗口' : '最大化'}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-11 rounded-none"
            aria-label={windowState.isMaximized ? '还原窗口' : '最大化'}
            onClick={() => void controls.toggleMaximize()}
          >
            {windowState.isMaximized ? <Square size={13} /> : <Maximize2 size={15} />}
          </Button>
        </Tooltip>
        <Tooltip content="关闭窗口">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-11 rounded-none hover:bg-destructive hover:text-destructive-foreground"
            aria-label="关闭窗口"
            onClick={() => void controls.close()}
          >
            <X size={17} />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
