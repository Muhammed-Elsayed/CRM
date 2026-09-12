import { execFileSync } from 'node:child_process'

const database = process.env.TEST_DATABASE_URL
if (!database || !new URL(database).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL must name an isolated _test database.')
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: database,
  JWT_SECRET: 'browser-test-secret-with-more-than-32-characters',
  CORS_ORIGINS: 'http://127.0.0.1:5179', AUTH_ALLOW_INSECURE_HTTP: 'true', AUTH_ACCESS_TOKEN_SECONDS: '2',
})
execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
  cwd: '../back-end', env: process.env, stdio: 'pipe',
})
const { prisma } = await import('../../../back-end/dist/db/config.js')
const { createHash } = await import('../../../back-end/dist/utilities/hash-password.js')
const { app } = await import('../../../back-end/dist/app.js')
const email = 'browser-auth-test@example.com'
await prisma.user.upsert({ where: { email },
  update: { passwordHash: await createHash('browser-test-password') },
  create: { email, name: 'Browser test', passwordHash: await createHash('browser-test-password') },
})
const server = app.listen(55440, '127.0.0.1')
process.on('SIGTERM', async () => {
  await prisma.user.deleteMany({ where: { email } })
  await prisma.$disconnect()
  server.close(() => process.exit(0))
})
