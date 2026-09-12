export const AUTH_TOKEN_STORAGE_KEY = 'clientflow.authToken'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'
export type AuthSnapshot = { status: AuthStatus; token: string | null; error: string | null }
let snapshot: AuthSnapshot = { status: 'loading', token: null, error: null }
const listeners = new Set<() => void>()

// Access tokens from the previous implementation must not survive a deployment.
try { localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY) } catch { /* Storage may be disabled. */ }

export function getAuthSnapshot() { return snapshot }
export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function setAuthSnapshot(next: AuthSnapshot) {
  snapshot = next
  listeners.forEach(listener => listener())
}
export function persistAuthToken(token: string) {
  setAuthSnapshot({ status: 'authenticated', token, error: null })
}
export function getStoredAuthToken() { return snapshot.token }
export function clearStoredAuthToken() {
  setAuthSnapshot({ status: 'anonymous', token: null, error: null })
}
