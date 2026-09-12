import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import axios, { AxiosError, AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const mocks = vi.hoisted(() => ({ adapter: vi.fn() }))
vi.mock('axios', async importOriginal => {
  const original = await importOriginal<typeof import('axios')>()
  return { ...original, default: { ...original.default,
    create: (config: object) => original.default.create({ ...config, adapter: mocks.adapter }),
  } }
})

const sessionBody = (token = 'access-token') => ({
  statusCode: 200, message: 'OK', timestamp: new Date().toISOString(),
  data: { token, user: { id: 'user-1', name: 'User', email: 'user@example.com', createdAt: new Date().toISOString() } },
})
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  config, data, status, statusText: '', headers: new AxiosHeaders(),
})
const fail = (config: InternalAxiosRequestConfig, status = 401, statusText = 'Unauthorized'): never => {
  throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response(config, { statusText }, status))
}

beforeEach(() => {
  vi.resetModules()
  mocks.adapter.mockReset()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('localStorage', { removeItem: vi.fn() })
  vi.stubGlobal('BroadcastChannel', class { postMessage = vi.fn(); addEventListener = vi.fn() })
})

describe('browser authentication lifecycle', () => {
  it('restores in memory and shares concurrent refreshes', async () => {
    mocks.adapter.mockImplementation(async config => response(config, sessionBody()))
    const auth = await import('../../src/shared/auth/authSession')
    const store = await import('../../src/shared/auth/authTokenStorage')
    const [a, b] = await Promise.all([auth.refreshSession(), auth.refreshSession()])
    expect(a).toBe(b)
    expect(mocks.adapter).toHaveBeenCalledTimes(1)
    expect(store.getAuthSnapshot().status).toBe('authenticated')
    expect(localStorage.removeItem).toHaveBeenCalledWith('clientflow.authToken')
    const request = mocks.adapter.mock.calls[0][0]
    expect(request.withCredentials).toBe(true)
    expect(request.headers['X-CRM-Auth']).toBe('1')
  })

  it('distinguishes an invalid session from an outage and supports retry', async () => {
    mocks.adapter.mockImplementation(async config => fail(config, 503))
    const auth = await import('../../src/shared/auth/authSession')
    const store = await import('../../src/shared/auth/authTokenStorage')
    await auth.restoreSession()
    expect(store.getAuthSnapshot().status).toBe('error')
    mocks.adapter.mockImplementation(async config => response(config, sessionBody()))
    await auth.restoreSession()
    expect(store.getAuthSnapshot().status).toBe('authenticated')
    mocks.adapter.mockImplementation(async config => fail(config))
    await expect(auth.refreshSession()).rejects.toBeInstanceOf(AxiosError)
    expect(store.getAuthSnapshot().status).toBe('anonymous')
  })

  it('retries concurrent expired requests once with one refreshed token', async () => {
    mocks.adapter.mockImplementation(async config => {
      if (config.url.includes('/auth/')) return response(config, sessionBody('new-token'))
      if (config.headers.Authorization === 'Bearer old-token') return fail(config, 401, 'AccessTokenExpired')
      return response(config, { ok: true })
    })
    const store = await import('../../src/shared/auth/authTokenStorage')
    store.persistAuthToken('old-token')
    const { httpClient } = await import('../../src/shared/api/httpClient')
    const values = await Promise.all([httpClient.get('/api/companies'), httpClient.get('/api/contacts')])
    expect(values.every(value => value.data.ok)).toBe(true)
    expect(mocks.adapter.mock.calls.filter(([config]) => config.url.includes('/auth/'))).toHaveLength(1)
    expect(mocks.adapter).toHaveBeenCalledTimes(5)
  })

  it('does not loop on retry, renew 403, or renew authentication endpoints', async () => {
    mocks.adapter.mockImplementation(async config => config.url.endsWith('/refresh')
      ? response(config, sessionBody('new-token')) : fail(config, 401, 'AccessTokenExpired'))
    const store = await import('../../src/shared/auth/authTokenStorage')
    store.persistAuthToken('old-token')
    const { httpClient } = await import('../../src/shared/api/httpClient')
    await expect(httpClient.get('/api/companies')).rejects.toBeInstanceOf(AxiosError)
    expect(mocks.adapter).toHaveBeenCalledTimes(3)
    mocks.adapter.mockClear()
    mocks.adapter.mockImplementation(async config => fail(config, 403))
    await expect(httpClient.get('/api/companies')).rejects.toBeInstanceOf(AxiosError)
    expect(mocks.adapter).toHaveBeenCalledTimes(1)
    mocks.adapter.mockClear()
    mocks.adapter.mockImplementation(async config => fail(config, 401, 'AccessTokenExpired'))
    await expect(httpClient.post('/api/auth/login')).rejects.toBeInstanceOf(AxiosError)
    expect(mocks.adapter).toHaveBeenCalledTimes(1)
    expect(axios.isAxiosError(new AxiosError())).toBe(true)
  })

  it('failed logout preserves the session; successful logout clears data and prevents restoration', async () => {
    const auth = await import('../../src/shared/auth/authSession')
    const store = await import('../../src/shared/auth/authTokenStorage')
    const clearCache = vi.fn()
    auth.onSessionBoundary(clearCache)
    store.persistAuthToken('old-token')
    mocks.adapter.mockImplementation(async config => fail(config, 503))
    await expect(auth.logoutSession()).rejects.toBeInstanceOf(AxiosError)
    expect(store.getStoredAuthToken()).toBe('old-token')
    expect(clearCache).not.toHaveBeenCalled()
    mocks.adapter.mockImplementation(async config => response(config, {}))
    await auth.logoutSession()
    expect(store.getAuthSnapshot().status).toBe('anonymous')
    expect(clearCache).toHaveBeenCalledOnce()
    const calls = mocks.adapter.mock.calls.length
    await auth.restoreSession()
    expect(mocks.adapter).toHaveBeenCalledTimes(calls)
    expect(store.getAuthSnapshot().status).toBe('anonymous')
  })

  it('ignores an in-flight refresh superseded by logout', async () => {
    let release!: () => void
    let entered!: () => void
    const started = new Promise<void>(resolve => { entered = resolve })
    mocks.adapter.mockImplementation(async config => {
      if (config.url.endsWith('/refresh')) {
        entered()
        await new Promise<void>(resolve => { release = resolve })
        return response(config, sessionBody('obsolete-token'))
      }
      return response(config, {})
    })
    const auth = await import('../../src/shared/auth/authSession')
    const store = await import('../../src/shared/auth/authTokenStorage')
    const pending = auth.refreshSession().catch(() => {})
    await started
    const logout = auth.logoutSession()
    release()
    await Promise.all([pending, logout])
    expect(store.getStoredAuthToken()).toBeNull()
    expect(store.getAuthSnapshot().status).toBe('anonymous')
  })

  it('serializes independent tab leases without storing tokens', async () => {
    const { withSessionLease } = await import('../../src/shared/auth/authCoordinator')
    let active = 0
    let peak = 0
    const operation = () => withSessionLease(async lease => {
      active++
      peak = Math.max(peak, active)
      await new Promise(resolve => setTimeout(resolve, 15))
      await lease.assertOwned()
      active--
    })
    await Promise.all([operation(), operation(), operation()])
    expect(peak).toBe(1)
  })

  it('does not replay a request from a previous login after the session changes', async () => {
    let release!: () => void
    let entered!: () => void
    const started = new Promise<void>(resolve => { entered = resolve })
    mocks.adapter.mockImplementation(async config => {
      if (config.url === '/api/companies') {
        entered()
        await new Promise<void>(resolve => { release = resolve })
        return fail(config, 401, 'AccessTokenExpired')
      }
      return response(config, sessionBody('new-login-token'))
    })
    const auth = await import('../../src/shared/auth/authSession')
    const store = await import('../../src/shared/auth/authTokenStorage')
    const { httpClient } = await import('../../src/shared/api/httpClient')
    store.persistAuthToken('previous-login-token')
    const pending = httpClient.get('/api/companies').catch(error => error)
    await started
    await auth.logoutSession()
    await auth.loginSession({ email: 'user@example.com', password: 'password' })
    release()
    expect(await pending).toBeInstanceOf(AxiosError)
    expect(mocks.adapter.mock.calls.filter(([config]) => config.url === '/api/companies')).toHaveLength(1)
    expect(store.getStoredAuthToken()).toBe('new-login-token')
  })

  it('rejects a lease that expired while a tab was suspended', async () => {
    const { withSessionLease } = await import('../../src/shared/auth/authCoordinator')
    let now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now)
    try {
      await withSessionLease(async lease => {
        now += 21_000
        await expect(lease.assertOwned()).rejects.toThrow('coordination was interrupted')
        await expect(lease.changeSession(false)).rejects.toThrow('coordination was interrupted')
      })
    } finally { clock.mockRestore() }
  })
})
