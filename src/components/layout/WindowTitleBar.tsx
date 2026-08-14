import { Braces, CornerDownLeft, Maximize2, Minus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Tooltip } from '@/components/ui/tooltip'

type WindowState = {
  isFullscreen: boolean
}

type PaletteCommand = {
  id: string
  label: string
  keywords: string
  execute: () => void
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [windowState, setWindowState] = useState(initialWindowState)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const controls = window.electronAPI?.windowControls
  const isMac = window.electronAPI?.platform === 'darwin'

  const commands: PaletteCommand[] = [
    { id: 'json-tools', label: '打开 JSON Tools', keywords: 'json 格式化 校验', execute: () => navigate('/json-tools') },
    { id: 'log-viewer', label: '打开 Log Viewer', keywords: '日志 请求 响应', execute: () => navigate('/log-viewer') },
    { id: 'todos', label: '打开代办任务', keywords: '任务 todo 待办', execute: () => navigate('/todos') },
    { id: 'theme', label: isDark ? '切换为浅色模式' : '切换为深色模式', keywords: '主题 外观 dark light', execute: onToggleTheme },
    { id: 'sidebar', label: isSidebarCollapsed ? '展开功能导航' : '收起功能导航', keywords: '侧栏 导航', execute: onToggleSidebar },
  ]
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matchingCommands = normalizedQuery
    ? commands.filter((command) => `${command.label} ${command.keywords}`.toLocaleLowerCase().includes(normalizedQuery))
    : commands

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
      inputRef.current?.focus()
      inputRef.current?.select()
    }

    window.addEventListener('keydown', focusCommandPanel)
    return () => window.removeEventListener('keydown', focusCommandPanel)
  }, [isMac, windowState.isFullscreen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isMac || !controls || windowState.isFullscreen) return null

  const executeCommand = (command: PaletteCommand) => {
    command.execute()
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleCommandKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setQuery('')
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (matchingCommands.length === 0) return
      setSelectedIndex((index) => Math.min(index + 1, matchingCommands.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (matchingCommands.length === 0) return
      setSelectedIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter' && matchingCommands[selectedIndex]) {
      event.preventDefault()
      executeCommand(matchingCommands[selectedIndex])
    }
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
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleCommandKeyDown}
            className="h-6 w-full rounded border bg-muted/50 py-0 pl-7 pr-14 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            type="text"
            role="combobox"
            aria-label="命令面板"
            aria-autocomplete="list"
            aria-controls="mac-command-list"
            aria-expanded={isOpen}
            aria-activedescendant={matchingCommands[selectedIndex] ? `mac-command-${matchingCommands[selectedIndex].id}` : undefined}
            placeholder="搜索命令"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">⌘P</kbd>
        </div>
        {isOpen && (
          <div id="mac-command-list" className="mt-1 overflow-hidden rounded-md border bg-popover p-1 shadow-lg" role="listbox" aria-label="可用命令">
            {matchingCommands.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">未找到命令</p>
            ) : (
              matchingCommands.map((command, index) => (
                <button
                  key={command.id}
                  id={`mac-command-${command.id}`}
                  type="button"
                  className={`flex h-7 w-full items-center rounded px-2 text-left text-xs ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-popover-foreground hover:bg-accent'}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => executeCommand(command)}
                >
                  {command.label}
                  <CornerDownLeft className="ml-auto text-muted-foreground" size={12} aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  )
}
