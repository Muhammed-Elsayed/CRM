import { useEffect, useSyncExternalStore } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthSnapshot, subscribeAuth } from '@/shared/auth/authTokenStorage'
import { restoreSession } from '@/shared/auth/authSession'

function ProtectedRoute() {
  const location = useLocation()
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
  useEffect(() => { void restoreSession() }, [])

  if (auth.status === 'loading') return <p role="status" className="p-6">Restoring your session…</p>
  if (auth.status === 'error') return (
    <div className="p-6" role="alert">
      <p>{auth.error}</p>
      <button type="button" onClick={() => void restoreSession()} className="mt-3 underline">Retry</button>
    </div>
  )
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export { ProtectedRoute }
