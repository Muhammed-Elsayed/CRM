import { prisma } from '../db/config.js'

try {
    const result = await prisma.authSession.deleteMany({ where: { expiresAt: { lte: new Date() } } })
    console.log(`Removed ${result.count} expired authentication sessions`)
} finally {
    await prisma.$disconnect()
}
