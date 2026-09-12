import axios from 'axios'
import { getStoredAuthToken } from '@/shared/auth/authTokenStorage'
import { getAuthGeneration, refreshSession } from '@/shared/auth/authSession'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

httpClient.interceptors.request.use(config => {
  const tracked = config as typeof config & { authGeneration?: number }
  tracked.authGeneration ??= getAuthGeneration()
  if (tracked.authGeneration !== getAuthGeneration()) return Promise.reject(new Error('Session changed. Please retry.'))
  const token = getStoredAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  else delete config.headers.Authorization
  return config
})

httpClient.interceptors.response.use(response => response, async error => {
  const request = error.config
  if (!request || request.authRetried || /\/api\/auth(?:\/|$)/.test(request.url ?? '') ||
      error.response?.status !== 401 || error.response?.data?.statusText !== 'AccessTokenExpired') {
    return Promise.reject(error)
  }
  if (request.authGeneration !== getAuthGeneration()) return Promise.reject(error)
  request.authRetried = true
  // A response may arrive after another request already renewed the access token.
  const current = getStoredAuthToken()
  if (!current || request.headers.Authorization === `Bearer ${current}`) await refreshSession()
  return httpClient(request)
})

export { httpClient }
