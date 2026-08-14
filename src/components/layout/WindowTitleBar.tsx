import { Braces, ListTodo, Maximize2, Minus, Moon, PanelLeftClose, PanelLeftOpen, ScrollText, Search, Sun, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import type { MacCommandAction } from './MacCommandDialog'

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

const MacCommandDialog = lazy(async () => {
  const module = await import('./MacCommandDialog')
  return { default: module.MacCommandDialog }
})

export function WindowTitleBar({ isDark, isSidebarCollapsed, onToggleTheme, onToggleSidebar }: WindowTitleBarProps) {
  const navigate = useNavigate()
  const [windowState, setWindowState] = useState(initialWindowState)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const controls = window.electronAPI?.windowControls
  const isMac = window.electronAPI?.platform === 'darwin'
  const runCommand = (action: () => void) => () => {
    action()
    setIsCommandOpen(false)
  }

  const toolCommands: MacCommandAction[] = [
    { id: 'json-tools', label: '打开 JSON Tools', keywords: ['json', '格式化', '校验'], icon: Braces, onSelect: runCommand(() => navigate('/json-tools')) },
    { id: 'log-viewer', label: '打开 Log Viewer', keywords: ['日志', '请求', '响应'], icon: ScrollText, onSelect: runCommand(() => navigate('/log-viewer')) },
    { id: 'todos', label: '打开代办任务', keywords: ['任务', 'todo', '待办'], icon: ListTodo, onSelect: runCommand(() => navigate('/todos')) },
  ]
  const appearanceCommands: MacCommandAction[] = [
    { id: 'theme', label: isDark ? '切换为浅色模式' : '切换为深色模式', keywords: ['主题', '外观', 'dark', 'light'], icon: isDark ? Sun : Moon, onSelect: runCommand(onToggleTheme) },
    { id: 'sidebar', label: isSidebarCollapsed ? '展开功能导航' : '收起功能导航', keywords: ['侧栏', '导航'], icon: isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose, onSelect: runCommand(onToggleSidebar) },
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
        <Button
          type="button"
          variant="outline"
          className="h-7 w-full justify-start bg-muted/50 px-2 text-xs font-normal text-muted-foreground"
          aria-label="命令面板"
          aria-haspopup="dialog"
          aria-expanded={isCommandOpen}
          onClick={openCommand}
        >
          <Search size={13} aria-hidden="true" />
          <span>搜索命令...</span>
          <Kbd className="ml-auto h-4 border-0 bg-transparent px-0 text-[10px]">⌘P</Kbd>
        </Button>
      </div>
      {isCommandOpen && (
        <Suspense fallback={null}>
          <MacCommandDialog
            appearanceCommands={appearanceCommands}
            onOpenChange={setIsCommandOpen}
            open={isCommandOpen}
            toolCommands={toolCommands}
          />
        </Suspense>
      )}
    </header>
  )
}
