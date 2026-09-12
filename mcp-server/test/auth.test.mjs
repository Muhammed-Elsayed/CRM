import assert from 'node:assert/strict'
import test from 'node:test'
import { BackendAuthManager } from '../dist/middleware/auth.js'
import { createCrmClient } from '../dist/clients/crm.client.js'

const success = (token, cookie = 'a') => Response.json({ data: { token } }, {
  headers: { 'Set-Cookie': `crm_refresh=${cookie.repeat(43)}; HttpOnly; Path=/api/auth; SameSite=Lax` },
})
const manager = () => new BackendAuthManager('http://backend.test', { email: 'mcp@example.com', password: 'secret-password' })
const signal = () => AbortSignal.timeout(5000)
const expired = () => Response.json({ statusText: 'AccessTokenExpired' }, { status: 401 })

function clientConfig(t) {
  const old = { BACKEND_EMAIL: process.env.BACKEND_EMAIL, BACKEND_PASSWORD: process.env.BACKEND_PASSWORD, BACKEND_BASE_URL: process.env.BACKEND_BASE_URL }
  Object.assign(process.env, { BACKEND_EMAIL: `${crypto.randomUUID()}@example.com`, BACKEND_PASSWORD: 'secret-password', BACKEND_BASE_URL: 'http://backend.test' })
  t.after(() => { for (const [key, value] of Object.entries(old)) value === undefined ? delete process.env[key] : process.env[key] = value })
}

test('concurrent callers share login and rotation; subsequent refresh uses replacement cookie', async t => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options })
    await new Promise(resolve => setTimeout(resolve, 5))
    return success(`token-${requests.length}`, String.fromCharCode(96 + requests.length))
  })
  const auth = manager()
  assert.deepEqual(await Promise.all([auth.getToken(signal()), auth.getToken(signal())]), ['token-1', 'token-1'])
  assert.equal(requests.length, 1)
  assert.equal(requests[0].options.headers['X-CRM-Auth'], '1')
  assert.equal(JSON.parse(requests[0].options.body).email, 'mcp@example.com')
  assert.deepEqual(await Promise.all([auth.renew('token-1', signal()), auth.renew('token-1', signal())]), ['token-2', 'token-2'])
  assert.equal(requests[1].options.headers.Cookie, `crm_refresh=${'a'.repeat(43)}`)
  assert.equal(await auth.renew('token-1', signal()), 'token-2')
  assert.equal(requests.length, 2)
  await auth.renew('token-2', signal())
  assert.equal(requests[2].options.headers.Cookie, `crm_refresh=${'b'.repeat(43)}`)
})

test('expired refresh session permits exactly one new credential login', async t => {
  const paths = []
  t.mock.method(globalThis, 'fetch', async url => {
    paths.push(url.pathname)
    return url.pathname.endsWith('refresh') ? new Response(null, { status: 401 }) : success(`login-${paths.length}`)
  })
  const auth = manager()
  const first = await auth.getToken(signal())
  assert.equal(await auth.renew(first, signal()), 'login-3')
  assert.deepEqual(paths, ['/api/auth/login', '/api/auth/refresh', '/api/auth/login'])
})

test('network, server and forbidden refresh failures never trigger credential login', async t => {
  for (const failure of [403, 503, 'network']) {
    let calls = 0
    const mock = t.mock.method(globalThis, 'fetch', async () => {
      if (++calls === 1) return success('initial')
      if (failure === 'network') throw new Error('sensitive internal connection details')
      return new Response(null, { status: failure })
    })
    const auth = manager()
    await auth.getToken(signal())
    await assert.rejects(auth.renew('initial', signal()), error => !error.message.includes('sensitive'))
    assert.equal(calls, 2)
    mock.mock.restore()
  }
})

test('one caller timing out does not cancel shared login', async t => {
  t.mock.method(globalThis, 'fetch', async () => {
    await new Promise(resolve => setTimeout(resolve, 30))
    return success('initial')
  })
  const auth = manager()
  const short = auth.getToken(AbortSignal.timeout(5))
  const long = auth.getToken(signal())
  await assert.rejects(short, /timed out/)
  assert.equal(await long, 'initial')
})

test('client retries expired access once and never loops', async t => {
  clientConfig(t)
  const paths = []
  t.mock.method(globalThis, 'fetch', async url => {
    paths.push(url.pathname)
    return url.pathname.includes('/auth/') ? success(`token-${paths.length}`) : expired()
  })
  await assert.rejects(createCrmClient().get('/api/companies', {}, signal(), 'list companies'), /authentication/)
  assert.deepEqual(paths, ['/api/auth/login', '/api/companies', '/api/auth/refresh', '/api/companies'])
})

test('403 does not renew and malformed auth responses are rejected without leaking credentials', async t => {
  clientConfig(t)
  const mock = t.mock.method(globalThis, 'fetch', async url => url.pathname.includes('/auth/')
    ? success('initial') : new Response(null, { status: 403 }))
  await assert.rejects(createCrmClient().get('/api/companies', {}, signal(), 'list companies'), /authorization/)
  assert.equal(mock.mock.callCount(), 2)
  mock.mock.restore()
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: { token: 'secret-token' } }))
  await assert.rejects(manager().getToken(signal()), error => !error.message.includes('secret-token'))
})
