import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ClientsPage from '@/pages/ClientsPage'
import ClientWorkspacePage from '@/pages/ClientWorkspacePage'
import InvestigationsPage from '@/pages/InvestigationsPage'
import InvestigationDetailPage from '@/pages/InvestigationDetailPage'
import NewInvestigationWizard from '@/components/investigations/NewInvestigationWizard'
import AlertTemplatesPage from '@/pages/AlertTemplatesPage'
import RulesWikiPage from '@/pages/RulesWikiPage'
import SettingsPage from '@/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientWorkspacePage />} />
          <Route path="investigations" element={<InvestigationsPage />} />
          <Route path="investigations/new" element={<NewInvestigationWizard />} />
          <Route path="investigations/:id" element={<InvestigationDetailPage />} />
          <Route path="templates" element={<AlertTemplatesPage />} />
          <Route path="rules-wiki" element={<RulesWikiPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
