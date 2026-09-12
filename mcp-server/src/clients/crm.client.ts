import { getBackendBaseUrl } from '../config.js'
import { getBackendAuthManager } from '../middleware/auth.js'

export function createCrmClient() {
  const auth = getBackendAuthManager()
  const baseUrl = getBackendBaseUrl()

  return {
    async get(path: string, query: Record<string, string>, signal: AbortSignal, operation: string): Promise<unknown> {
      const url = new URL(path, baseUrl)
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
      let token = await auth.getToken(signal)
      const send = () => fetch(url, {
        headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal,
      }).catch(() => {
        throw new Error('Could not reach the backend or the request timed out. Check that the backend is running and BACKEND_BASE_URL is correct.')
      })

      let response = await send()
      if (response.status === 401) {
        const failure = await response.clone().json().catch(() => null)
        if (failure?.statusText === 'AccessTokenExpired') {
          token = await auth.renew(token, signal)
          response = await send()
        }
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Backend authentication or authorization failed. Check the configured account and its access.')
      }
      if (!response.ok) throw new Error(`The backend could not ${operation} (HTTP ${response.status}).`)
      return response.json().catch(() => null)
    },
  }
}
