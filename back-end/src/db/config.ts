import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { config } from '../config/index.js'

const adapter = new PrismaPg({
  connectionString: config.databaseUrl,
})

const prisma = new PrismaClient({ adapter })

async function connectDatabase() {
  await prisma.$connect()
  console.log('Connected to PostgreSQL database')
}

async function disconnectDatabase() {
  await prisma.$disconnect()
}

async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`
}

export { checkDatabaseConnection, connectDatabase, disconnectDatabase, prisma }
