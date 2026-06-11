import { Navigate, Route, Routes } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { CompaniesPage } from '@/features/companies/CompaniesPage'
import { ContactsPage } from '@/features/contacts/ContactsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LeadsPage } from '@/features/pipeline/LeadsPage'
import { CrmLayout } from '@/shared/layout/CrmLayout'

import { ProtectedRoute } from './ProtectedRoute'

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<CrmLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export { AppRouter }
