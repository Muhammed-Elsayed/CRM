import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getStoredAuthToken } from '@/shared/auth/authTokenStorage'

function ProtectedRoute() {
  const location = useLocation()

  if (!getStoredAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export { ProtectedRoute }
