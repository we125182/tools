import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JsonToolPage } from '@/pages/json-tools'
import { LogViewerPage } from '@/pages/log-viewer'

export function AppRouter() {
  return (
    <TooltipProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppShell>
          <Routes>
            <Route path="/json-tools" element={<JsonToolPage />} />
            <Route path="/log-viewer" element={<LogViewerPage />} />
            <Route path="*" element={<Navigate to="/json-tools" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  )
}
