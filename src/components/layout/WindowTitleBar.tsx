import { Braces, Maximize2, Minus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Tooltip } from '@/components/ui/tooltip'
import { Command, type CommandItem } from '@/components/ui/command'

type WindowState = {
  isFullscreen: boolean
}

type WindowTitleBarProps = {
  isDark: boolean
  isSidebarCollapsed: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
}

const initialWindowState: WindowState = {
  isFullscreen: false,
}

export function WindowTitleBar({ isDark, isSidebarCollapsed, onToggleTheme, onToggleSidebar }: WindowTitleBarProps) {
  const navigate = useNavigate()
  const triggerRef = useRef<HTMLInputElement>(null)
  const [windowState, setWindowState] = useState(initialWindowState)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const controls = window.electronAPI?.windowControls
  const isMac = window.electronAPI?.platform === 'darwin'

  const commands: CommandItem[] = [
    { id: 'json-tools', label: '打开 JSON Tools', keywords: 'json 格式化 校验', onSelect: () => navigate('/json-tools') },
    { id: 'log-viewer', label: '打开 Log Viewer', keywords: '日志 请求 响应', onSelect: () => navigate('/log-viewer') },
    { id: 'todos', label: '打开代办任务', keywords: '任务 todo 待办', onSelect: () => navigate('/todos') },
    { id: 'theme', label: isDark ? '切换为浅色模式' : '切换为深色模式', keywords: '主题 外观 dark light', onSelect: onToggleTheme },
    { id: 'sidebar', label: isSidebarCollapsed ? '展开功能导航' : '收起功能导航', keywords: '侧栏 导航', onSelect: onToggleSidebar },
  ]

  useEffect(() => {
    if (!isMac || !controls) return

    let mounted = true
    void controls.getState().then((state) => {
      if (mounted) setWindowState(state)
    })

    return () => {
      mounted = false
    }
  }, [controls, isMac])

  useEffect(() => {
    if (!isMac || !controls) return
    return controls.onStateChange(setWindowState)
  }, [controls, isMac])

  useEffect(() => {
    if (!isMac || windowState.isFullscreen) return

    const focusCommandPanel = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLocaleLowerCase() !== 'p') return
      event.preventDefault()
      setIsCommandOpen(true)
    }

    window.addEventListener('keydown', focusCommandPanel)
    return () => window.removeEventListener('keydown', focusCommandPanel)
  }, [isMac, windowState.isFullscreen])

  useEffect(() => {
    if (windowState.isFullscreen) setIsCommandOpen(false)
  }, [windowState.isFullscreen])

  if (!isMac || !controls || windowState.isFullscreen) return null

  const openCommand = () => {
    triggerRef.current?.blur()
    setIsCommandOpen(true)
  }

  return (
    <header className="electron-titlebar relative flex h-9 shrink-0 items-center border-b bg-background text-muted-foreground">
      <div className="electron-titlebar-controls flex h-full shrink-0 items-center gap-2 px-3" aria-label="窗口控制">
        <Tooltip content="关闭窗口">
          <button
            type="button"
            className="mac-window-control group flex size-3 items-center justify-center rounded-full bg-[#ff5f57] text-[#4f1715] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="关闭窗口"
            onClick={() => void controls.close()}
          >
            <X className="opacity-0 transition-opacity group-hover:opacity-100" size={8} strokeWidth={2.5} />
          </button>
        </Tooltip>
        <Tooltip content="最小化">
          <button
            type="button"
            className="mac-window-control group flex size-3 items-center justify-center rounded-full bg-[#febc2e] text-[#5f4100] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="最小化"
            onClick={() => void controls.minimize()}
          >
            <Minus className="opacity-0 transition-opacity group-hover:opacity-100" size={8} strokeWidth={2.5} />
          </button>
        </Tooltip>
        <Tooltip content="进入全屏">
          <button
            type="button"
            className="mac-window-control group flex size-3 items-center justify-center rounded-full bg-[#28c840] text-[#0b4b1a] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="进入全屏"
            onClick={() => void controls.toggleFullscreen()}
          >
            <Maximize2 className="opacity-0 transition-opacity group-hover:opacity-100" size={7} strokeWidth={2.5} />
          </button>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2 px-1 text-xs font-medium">
        <Braces size={14} aria-hidden="true" />
        <span>JSON Tools</span>
      </div>

      <div className="mac-command-panel absolute left-1/2 top-1/2 z-10 w-[min(30rem,48vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" size={13} aria-hidden="true" />
          <input
            ref={triggerRef}
            onClick={openCommand}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openCommand()
              }
            }}
            className="h-6 w-full cursor-pointer rounded border bg-muted/50 py-0 pl-7 pr-14 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            type="text"
            readOnly
            aria-label="命令面板"
            aria-haspopup="dialog"
            aria-expanded={isCommandOpen}
            placeholder="搜索命令"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">⌘P</kbd>
        </div>
      </div>
      <Command items={commands} open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </header>
  )
}
