import axios from 'axios'
import { signInResponseSchema } from '@/features/auth/schemas/authApiSchemas'
import type { SignInInput } from '@/features/auth/types'
import { withSessionLease } from './authCoordinator'
import {
  clearStoredAuthToken, getAuthSnapshot, persistAuthToken, setAuthSnapshot,
} from './authTokenStorage'

const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '',
  withCredentials: true,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json', 'X-CRM-Auth': '1' },
})
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('clientflow-auth')
let generation = 0
export function getAuthGeneration() { return generation }
let epoch: number | null = null
let refreshPromise: Promise<string> | null = null
const boundaryListeners = new Set<() => void>()

export function onSessionBoundary(listener: () => void) {
  boundaryListeners.add(listener)
  return () => { boundaryListeners.delete(listener) }
}
function clearSessionData() { boundaryListeners.forEach(listener => listener()) }
function announce(signedOut: boolean, nextEpoch: number) {
  epoch = nextEpoch
  channel?.postMessage({ signedOut, epoch })
}
class SessionChanged extends Error {}

channel?.addEventListener('message', (event: MessageEvent<unknown>) => {
  const data = event.data as { signedOut?: unknown; epoch?: unknown } | null
  if (!data || typeof data.signedOut !== 'boolean' || typeof data.epoch !== 'number') return
  if (epoch !== null && data.epoch <= epoch) return
  epoch = data.epoch
  generation++
  clearSessionData()
  clearStoredAuthToken()
  if (!data.signedOut) {
    setAuthSnapshot({ status: 'loading', token: null, error: null })
    // Wait for an obsolete in-flight refresh to finish before restoring the new login.
    void (refreshPromise ?? Promise.resolve()).catch(() => {}).then(() => restoreSession())
  }
})

export function refreshSession(): Promise<string> {
  if (refreshPromise) return refreshPromise
  const started = generation
  refreshPromise = withSessionLease(async lease => {
    if (started !== generation) throw new SessionChanged()
    if (lease.signedOut || (epoch !== null && epoch !== lease.epoch)) {
      clearSessionData()
      clearStoredAuthToken()
      throw new SessionChanged()
    }
    epoch = lease.epoch
    const response = await authClient.post('/api/auth/refresh', {})
    const result = signInResponseSchema.parse(response.data).data
    await lease.assertOwned()
    if (started !== generation) throw new SessionChanged()
    persistAuthToken(result.token)
    return result.token
  }).catch(error => {
    if (started === generation && !(error instanceof SessionChanged)) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearSessionData()
        clearStoredAuthToken()
      } else {
        setAuthSnapshot({ ...getAuthSnapshot(), status: 'error', error: 'Cannot restore your session. Please retry.' })
      }
    }
    throw error
  }).finally(() => { refreshPromise = null })
  return refreshPromise
}

export async function restoreSession() {
  if (getAuthSnapshot().status === 'authenticated') return
  setAuthSnapshot({ ...getAuthSnapshot(), status: 'loading', error: null })
  try { await refreshSession() } catch { /* State distinguishes rejection from temporary failure. */ }
}

export async function loginSession(input: SignInInput) {
  const started = ++generation
  return withSessionLease(async lease => {
    if (started !== generation) throw new SessionChanged('Login was superseded. Please retry.')
    const response = await authClient.post('/api/auth/login', input)
    const result = signInResponseSchema.parse(response.data).data
    await lease.assertOwned()
    if (started !== generation) throw new SessionChanged('Login was superseded. Please retry.')
    const nextEpoch = await lease.changeSession(false)
    clearSessionData()
    announce(false, nextEpoch)
    persistAuthToken(result.token)
    return result
  })
}

export async function logoutSession() {
  const started = ++generation
  await withSessionLease(async lease => {
    if (started !== generation) throw new SessionChanged('Session changed. Please try signing out again.')
    await authClient.post('/api/auth/logout', {})
    await lease.assertOwned()
    const nextEpoch = await lease.changeSession(true)
    clearSessionData()
    announce(true, nextEpoch)
    clearStoredAuthToken()
  })
}
