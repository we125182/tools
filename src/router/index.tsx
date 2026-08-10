import { Braces, Moon, ScrollText, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { JsonToolPage } from '@/components/json-tool/JsonToolPage'
import { LogViewerPage } from '@/components/log-viewer/LogViewerPage'
import { useJsonStore } from '@/stores/json'

type Feature = 'json-tools' | 'log-viewer'

const features: Array<{ feature: Feature; label: string; path: string }> = [
  { feature: 'json-tools', label: 'JSON Tools', path: '/json-tools' },
  { feature: 'log-viewer', label: 'Log Viewer', path: '/log-viewer' },
]

function FeatureIcon({ feature }: { feature: Feature }) {
  return feature === 'json-tools' ? <Braces size={16} /> : <ScrollText size={16} />
}

function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('jt:theme') === 'true')
  const reparse = useJsonStore((state) => state.reparse)
  const activeFeature: Feature = location.pathname.startsWith('/log-viewer')
    ? 'log-viewer'
    : 'json-tools'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('jt:theme', String(isDark))
  }, [isDark])

  useEffect(() => {
    reparse()
  }, [reparse])

  const title = activeFeature === 'json-tools' ? 'JSON Tools' : 'Log Viewer'
  const subtitle = activeFeature === 'json-tools'
    ? '校验 · 格式化 · 浏览'
    : '请求 · 响应 · JSON 浏览'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <aside
        aria-label="功能列表"
        className={`flex h-full shrink-0 flex-col border-r bg-muted/30 p-2 transition-[width] duration-200 ease-out ${collapsed ? 'w-14' : 'w-52'}`}
      >
        <div className="flex h-8 shrink-0 items-center px-2">
          {!collapsed && <span className="text-xs font-medium text-muted-foreground">工具</span>}
          <button
            type="button"
            className="ml-auto flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={collapsed ? '展开功能导航' : '收起功能导航'}
            title={collapsed ? '展开功能导航' : '收起功能导航'}
            onClick={() => setCollapsed((value) => !value)}
          >
            <span aria-hidden="true">{collapsed ? '>' : '<'}</span>
          </button>
        </div>
        <nav className="flex flex-col gap-1" aria-label="工具">
          {features.map((item) => (
            <div className="group relative" key={item.feature}>
              <NavLink
                to={item.path}
                aria-label={item.label}
                title={item.label}
                className={({ isActive }) => `flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                } ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
              >
                <FeatureIcon feature={item.feature} />
                {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
              </NavLink>
              {collapsed && (
                <span
                  data-feature-tooltip={item.feature === 'json-tools' ? '' : 'log-viewer'}
                  role="tooltip"
                  className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FeatureIcon feature={activeFeature} />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">{title}</h1>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="ml-auto flex h-7 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="切换深色模式"
            aria-pressed={isDark}
            title="切换深色模式"
            onClick={() => setIsDark((value) => !value)}
          >
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </header>
        <Routes>
          <Route path="/json-tools" element={<JsonToolPage />} />
          <Route path="/log-viewer" element={<LogViewerPage />} />
          <Route path="*" element={<Navigate to="/json-tools" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
