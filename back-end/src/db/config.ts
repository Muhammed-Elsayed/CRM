import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { config } from '../config/index.js'

const execFileAsync = promisify(execFile)
const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
const prismaCliPath = join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js')

const adapter = new PrismaPg({
  connectionString: config.databaseUrl,
})

const prisma = new PrismaClient({ adapter })

async function ensureDatabaseSchema() {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required before syncing the Prisma schema')
  }

  await access(prismaCliPath)

  const { stderr } = await execFileAsync(
    process.execPath,
    [prismaCliPath, 'db', 'push'],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl,
      },
    },
  )

  if (stderr.trim()) {
    console.warn(stderr.trim())
  }
}

async function connectDatabase() {
  await ensureDatabaseSchema()
  await prisma.$connect()
  console.log('Connected to PostgreSQL database')
}

export { connectDatabase, ensureDatabaseSchema, prisma }
