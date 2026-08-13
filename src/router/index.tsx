import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JsonToolPage } from '@/pages/json-tools'
import { LogViewerPage } from '@/pages/log-viewer'
import { TodoPage } from '@/pages/todos'

export function AppRouter() {
  const isElectron = Boolean(window.electronAPI)
  const Router = isElectron ? HashRouter : BrowserRouter

  return (
    <TooltipProvider>
      <Router basename={isElectron ? undefined : import.meta.env.BASE_URL}>
        <AppShell>
          <Routes>
            <Route path="/json-tools" element={<JsonToolPage />} />
            <Route path="/log-viewer" element={<LogViewerPage />} />
            <Route path="/todos" element={<TodoPage />} />
            <Route path="*" element={<Navigate to="/json-tools" replace />} />
          </Routes>
        </AppShell>
      </Router>
    </TooltipProvider>
  )
}
