import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import jwt from 'jsonwebtoken'

// Never fall back to the application's configured database for integration tests.
const database = process.env.TEST_DATABASE_URL
if (!database || !new URL(database).pathname.endsWith('_test')) {
  throw new Error('Set TEST_DATABASE_URL to a dedicated PostgreSQL database whose name ends in _test.')
}
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: database,
  JWT_SECRET: 'test-auth-secret-with-more-than-32-characters',
  CORS_ORIGINS: 'http://localhost:5173', AUTH_ALLOW_INSECURE_HTTP: 'true',
})
execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
  env: process.env, stdio: 'pipe',
})
const { app } = await import('../dist/app.js')
const { prisma } = await import('../dist/db/config.js')
const { SessionService, hashRefreshToken } = await import('../dist/services/session-service.js')
const { generateToken, verifyToken } = await import('../dist/middlewares/token.js')
const { createHash } = await import('../dist/utilities/hash-password.js')
const { config } = await import('../dist/config/index.js')

await test('authentication against isolated PostgreSQL', async t => {
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const users = []
  const service = new SessionService()
  const user = await prisma.user.create({ data: {
    name: 'Auth test', email: `${randomUUID()}@example.com`, passwordHash: await createHash('test-password'),
  } })
  users.push(user.id)
  t.after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: users } } })
    await prisma.$disconnect()
    await new Promise(resolve => server.close(resolve))
  })
  const post = (path, cookie, body = {}, extra = {}) => fetch(`${origin}/api/auth/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CRM-Auth': '1',
      ...(cookie ? { Cookie: cookie } : {}), ...extra }, body: JSON.stringify(body),
  })
  const cookie = response => response.headers.get('set-cookie').split(';')[0]
  const raw = response => cookie(response).split('=')[1]
  const unauthorized = promise => assert.rejects(promise, error => error.statusCode === 401)

  await t.test('login uses minimal expiring JWT, hashed refresh token and correct cookie', async () => {
    const response = await post('login', null, { email: user.email, password: 'test-password' })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const header = response.headers.get('set-cookie')
    for (const flag of ['HttpOnly', 'SameSite=Lax', 'Path=/api/auth', 'Expires=']) assert.ok(header.includes(flag))
    assert.ok(!header.includes('Secure'))
    assert.ok(!header.includes('Domain='))
    const body = await response.json()
    assert.deepEqual(Object.keys(body.data).sort(), ['token', 'user'])
    assert.equal(body.data.user.passwordHash, undefined)
    const decoded = jwt.verify(body.data.token, config.jwtSecret, { algorithms: ['HS256'] })
    assert.equal(decoded.sub, user.id)
    assert.equal(decoded.exp - decoded.iat, 900)
    assert.deepEqual(Object.keys(decoded).sort(), ['exp', 'iat', 'sub'])
    const saved = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(raw(response)) }, include: { session: true } })
    assert.ok(saved)
    assert.notEqual(saved.tokenHash, raw(response))
    assert.ok(Math.abs(saved.session.expiresAt.getTime() - Date.now() - 7 * 86400000) < 3000)
    const refresh = await post('refresh', cookie(response))
    assert.equal(refresh.status, 200)
    assert.notEqual(cookie(refresh), cookie(response))
    assert.equal(new Date(/Expires=([^;]+)/.exec(refresh.headers.get('set-cookie'))[1]).getTime(),
      new Date(/Expires=([^;]+)/.exec(header)[1]).getTime())
    const logout = await post('logout', cookie(refresh))
    assert.equal(logout.status, 200)
    assert.match(logout.headers.get('set-cookie'), /crm_refresh=;/)
    assert.equal((await post('refresh', cookie(refresh))).status, 401)
    assert.equal((await post('logout', cookie(refresh))).status, 200)
    assert.equal((await post('logout')).status, 200)
  })

  await t.test('credentials, CSRF header, browser origins and missing cookies are checked', async () => {
    assert.equal((await post('login', null, { email: user.email, password: 'wrong' })).status, 401)
    assert.equal((await post('refresh')).status, 401)
    assert.equal((await post('refresh', 'crm_refresh=malformed')).status, 401)
    assert.equal((await post('refresh', null, {}, { 'X-CRM-Auth': '' })).status, 403)
    assert.equal((await post('refresh', null, {}, { Origin: 'http://attacker.example' })).status, 403)
    assert.equal((await post('refresh', null, {}, { Origin: 'null' })).status, 403)
    assert.equal((await post('refresh', null, {}, { Origin: 'http://localhost:5173' })).status, 401)
  })

  await t.test('replay revokes descendants but preserves independent sessions', async () => {
    const a = await service.create(user.id)
    const independent = await service.create(user.id)
    const b = await service.refresh(a.refreshToken)
    await unauthorized(service.refresh(a.refreshToken))
    await unauthorized(service.refresh(b.refreshToken))
    assert.ok((await service.refresh(independent.refreshToken)).refreshToken)
  })

  await t.test('simultaneous spends serialize and revoke the compromised session', async () => {
    const a = await service.create(user.id)
    const results = await Promise.allSettled([service.refresh(a.refreshToken), service.refresh(a.refreshToken)])
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1)
    const winner = results.find(r => r.status === 'fulfilled').value
    await unauthorized(service.refresh(winner.refreshToken))
  })

  await t.test('logout racing rotation always revokes the whole session', async () => {
    const a = await service.create(user.id)
    const [refresh] = await Promise.allSettled([service.refresh(a.refreshToken), service.logout(a.refreshToken)])
    await unauthorized(service.refresh(a.refreshToken))
    if (refresh.status === 'fulfilled') await unauthorized(service.refresh(refresh.value.refreshToken))
  })

  await t.test('expired sessions and deleted users cannot refresh', async () => {
    const a = await service.create(user.id)
    const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(a.refreshToken) } })
    await prisma.authSession.update({ where: { id: token.sessionId }, data: { expiresAt: new Date(0) } })
    await unauthorized(service.refresh(a.refreshToken))
    const deleted = await prisma.user.create({ data: { name: 'Deleted', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } })
    const b = await service.create(deleted.id)
    await prisma.user.delete({ where: { id: deleted.id } })
    await unauthorized(service.refresh(b.refreshToken))
  })

  await t.test('failed replacement insertion rolls back token consumption', async () => {
    const a = await service.create(user.id)
    // A temporary constraint simulates an insertion failure inside the real transaction.
    await prisma.$executeRawUnsafe('ALTER TABLE refresh_tokens ADD CONSTRAINT auth_test_insert_failure CHECK ("consumedAt" IS NOT NULL) NOT VALID')
    try { await assert.rejects(service.refresh(a.refreshToken)) }
    finally { await prisma.$executeRawUnsafe('ALTER TABLE refresh_tokens DROP CONSTRAINT auth_test_insert_failure') }
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(a.refreshToken) } })
    assert.equal(row.consumedAt, null)
    assert.ok((await service.refresh(a.refreshToken)).refreshToken)
  })

  await t.test('access validation distinguishes expiry, invalid claims and database failures', async () => {
    const invoke = async authorization => {
      const res = { locals: {} }
      let failure
      await verifyToken({ headers: { authorization } }, res, error => { failure = error })
      return { failure, res }
    }
    assert.equal((await invoke()).failure.statusCode, 401)
    assert.equal((await invoke('Bearer broken extra')).failure.statusCode, 401)
    assert.equal((await invoke('Bearer broken')).failure.statusCode, 401)
    for (const payload of [{ userId: user.id }, { sub: 'not-a-uuid' }, { sub: user.id }]) {
      const malformed = jwt.sign(payload, config.jwtSecret)
      assert.equal((await invoke(`Bearer ${malformed}`)).failure.statusCode, 401)
    }
    const expired = jwt.sign({}, config.jwtSecret, { subject: user.id, expiresIn: -1 })
    assert.equal((await invoke(`Bearer ${expired}`)).failure.statusText, 'AccessTokenExpired')
    const wrongAlgorithm = jwt.sign({}, config.jwtSecret, { subject: user.id, expiresIn: 900, algorithm: 'HS384' })
    assert.equal((await invoke(`Bearer ${wrongAlgorithm}`)).failure.statusCode, 401)
    assert.equal((await invoke(`Bearer ${generateToken(randomUUID())}`)).failure.statusCode, 401)
    assert.equal((await invoke(`Bearer ${generateToken(user.id)}`)).res.locals.authUser.id, user.id)
    await prisma.$executeRawUnsafe('ALTER TABLE users RENAME TO users_auth_test_unavailable')
    try {
      const result = await invoke(`Bearer ${generateToken(user.id)}`)
      assert.ok(result.failure)
      assert.equal(result.failure.statusCode, undefined)
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE users_auth_test_unavailable RENAME TO users')
    }
  })

  await t.test('secure cookies default on and unsafe configuration fails validation', () => {
    const run = overrides => execFileSync(process.execPath, ['--input-type=module', '-e',
      "import {refreshCookieOptions} from './dist/middlewares/auth-request.js'; console.log(JSON.stringify(refreshCookieOptions))"],
      { env: { ...process.env, AUTH_ALLOW_INSECURE_HTTP: 'false', ...overrides }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    assert.match(run({}), /"secure":true/)
    assert.throws(() => run({ CORS_ORIGINS: '*' }))
    assert.throws(() => run({ AUTH_ACCESS_TOKEN_SECONDS: '0' }))
    assert.throws(() => run({ AUTH_ALLOW_INSECURE_HTTP: 'yes' }))
  })

  await t.test('cleanup removes expired history and preserves replay detection for live sessions', async () => {
    const expired = await prisma.authSession.create({ data: {
      userId: user.id, expiresAt: new Date(0), tokens: { create: { tokenHash: randomUUID() } },
    } })
    const live = await service.create(user.id)
    await service.refresh(live.refreshToken)
    execFileSync(process.execPath, ['dist/scripts/cleanup-auth-sessions.js'], { env: process.env, stdio: 'pipe' })
    assert.equal(await prisma.authSession.findUnique({ where: { id: expired.id } }), null)
    assert.equal(await prisma.refreshToken.count({ where: { sessionId: expired.id } }), 0)
    assert.ok((await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(live.refreshToken) } })).consumedAt)
    await unauthorized(service.refresh(live.refreshToken))
  })
})
