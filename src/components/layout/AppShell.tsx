import { Braces, FilePenLine, ListTodo, Moon, PanelLeftClose, PanelLeftOpen, ScrollText, Sun } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useJsonStore } from '@/stores/json'
import { WindowTitleBar } from './WindowTitleBar'

type Feature = 'json-tools' | 'log-viewer' | 'markdown' | 'todos'

const features: Array<{ feature: Feature; label: string; path: string }> = [
  { feature: 'json-tools', label: 'JSON Tools', path: '/json-tools' },
  { feature: 'log-viewer', label: 'Log Viewer', path: '/log-viewer' },
  { feature: 'markdown', label: 'Markdown 编辑器', path: '/markdown' },
  { feature: 'todos', label: '代办任务', path: '/todos' },
]

const featureTitles: Record<Feature, string> = {
  'json-tools': 'JSON Tools',
  'log-viewer': 'Log Viewer',
  markdown: 'Markdown 编辑器',
  todos: '代办任务',
}

function FeatureIcon({ feature }: { feature: Feature }) {
  if (feature === 'json-tools') return <Braces size={16} />
  if (feature === 'log-viewer') return <ScrollText size={16} />
  if (feature === 'markdown') return <FilePenLine size={16} />
  return <ListTodo size={16} />
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('jt:theme') === 'true')
  const reparse = useJsonStore((state) => state.reparse)
  const activeFeature = features.find((item) => location.pathname.startsWith(item.path))?.feature ?? 'json-tools'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('jt:theme', String(isDark))
  }, [isDark])

  useEffect(() => {
    reparse()
  }, [reparse])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <WindowTitleBar
        isDark={isDark}
        isSidebarCollapsed={collapsed}
        onToggleTheme={() => setIsDark((value) => !value)}
        onToggleSidebar={() => setCollapsed((value) => !value)}
      />
      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="功能列表"
          className={`flex h-full shrink-0 flex-col border-r bg-muted/30 p-2 transition-[width] duration-200 ease-out ${collapsed ? 'w-14' : 'w-52'}`}
        >
          <div className="flex h-8 shrink-0 items-center px-2">
            {!collapsed && <span className="text-xs font-medium text-muted-foreground">工具</span>}
            <Tooltip content={collapsed ? '展开功能导航' : '收起功能导航'} side="right">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto text-muted-foreground"
                aria-label={collapsed ? '展开功能导航' : '收起功能导航'}
                onClick={() => setCollapsed((value) => !value)}
              >
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </Button>
            </Tooltip>
          </div>
          <nav className="flex flex-col gap-1" aria-label="工具">
            {features.map((item) => {
              const link = (
                <NavLink
                  to={item.path}
                  aria-label={item.label}
                  className={({ isActive }) => `flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors ${
                    collapsed ? 'justify-center px-0' : ''
                  } ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                >
                  <FeatureIcon feature={item.feature} />
                  {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                </NavLink>
              )

              return <div key={item.feature}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</div>
            })}
          </nav>
          <div className="mt-auto shrink-0 pt-2">
            <Tooltip content={isDark ? '切换为浅色模式' : '切换为深色模式'} side={collapsed ? 'right' : 'top'}>
              <Button
                type="button"
                variant="ghost"
                className={`h-10 w-full text-muted-foreground ${collapsed ? 'px-0' : 'justify-start px-2'}`}
                aria-label={isDark ? '切换为浅色模式' : '切换为深色模式'}
                aria-pressed={isDark}
                onClick={() => setIsDark((value) => !value)}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                {!collapsed && <span>{isDark ? '浅色模式' : '深色模式'}</span>}
              </Button>
            </Tooltip>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="sr-only">{featureTitles[activeFeature]}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
