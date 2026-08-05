import { ZodError, z } from 'zod'

import { disconnectDatabase, prisma } from '../db/config.js'
import { createHash } from '../utilities/hash-password.js'

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined || value === '') {
    return false
  }

  if (typeof value !== 'string') {
    return value
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}, z.boolean())

const adminEnvSchema = z.object({
  ADMIN_NAME: z.string().trim().min(1),
  ADMIN_EMAIL: z.string().trim().email().transform((email) => email.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters long'),
  ADMIN_CREATE_IF_MISSING: booleanFromEnv.default(false),
})

async function createAdmin() {
  const adminEnv = adminEnvSchema.parse(process.env)
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEnv.ADMIN_EMAIL },
    select: { id: true, email: true },
  })

  if (existingUser) {
    if (adminEnv.ADMIN_CREATE_IF_MISSING) {
      console.log(`User ${existingUser.email} already exists; no changes made`)
      return
    }

    throw new Error('A user with ADMIN_EMAIL already exists')
  }

  const passwordHash = await createHash(adminEnv.ADMIN_PASSWORD)
  const user = await prisma.user.create({
    data: {
      name: adminEnv.ADMIN_NAME,
      email: adminEnv.ADMIN_EMAIL,
      passwordHash,
    },
    select: { email: true },
  })

  console.log(`Created admin user ${user.email}`)
}

createAdmin()
  .catch((error: unknown) => {
    if (error instanceof ZodError) {
      console.error('Invalid admin creation environment:')
      for (const issue of error.issues) {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`)
      }
    } else {
      console.error('Failed to create admin user')
      console.error(error)
    }

    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
