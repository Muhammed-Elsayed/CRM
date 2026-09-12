import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../db/config.js'
import { config } from '../config/index.js'
import { publicUserSelect } from '../models/user-model.js'
import { WebError } from '../utilities/web-errors.js'

export function hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
}

function newRefreshToken() {
    const refreshToken = randomBytes(32).toString('base64url')
    return { refreshToken, tokenHash: hashRefreshToken(refreshToken) }
}

export class SessionService {
    async create(userId: string) {
        const { refreshToken, tokenHash } = newRefreshToken()
        const expiresAt = new Date(Date.now() + config.sessionSeconds * 1000)
        await prisma.authSession.create({
            data: { userId, expiresAt, tokens: { create: { tokenHash } } },
        })
        return { refreshToken, expiresAt }
    }

    async refresh(rawToken: string | undefined) {
        if (!rawToken) throw WebError.UnAuthorized('Refresh session is invalid or expired')
        const tokenHash = hashRefreshToken(rawToken)
        const result = await prisma.$transaction(async (tx) => {
            const original = await tx.refreshToken.findUnique({ where: { tokenHash } })
            if (!original) return null
            // Serialize all cookie mutations on the parent, then re-read token state.
            await tx.$queryRaw`SELECT id FROM auth_sessions WHERE id = ${original.sessionId} FOR UPDATE`
            const session = await tx.authSession.findUnique({
                where: { id: original.sessionId },
                include: { user: { select: publicUserSelect } },
            })
            const token = await tx.refreshToken.findUnique({ where: { tokenHash } })
            const now = new Date()
            if (!session || !token || session.revokedAt || session.expiresAt <= now) return null
            if (token.consumedAt) {
                await tx.authSession.update({ where: { id: session.id }, data: { revokedAt: now } })
                // Returning commits replay revocation; throwing here would roll it back.
                return null
            }
            const replacement = newRefreshToken()
            await tx.refreshToken.update({ where: { id: token.id }, data: { consumedAt: now } })
            await tx.refreshToken.create({ data: { sessionId: session.id, tokenHash: replacement.tokenHash } })
            return { user: session.user, refreshToken: replacement.refreshToken, expiresAt: session.expiresAt }
        })
        if (!result) throw WebError.UnAuthorized('Refresh session is invalid or expired')
        return result
    }

    async logout(rawToken: string | undefined) {
        if (!rawToken) return
        await prisma.$transaction(async (tx) => {
            const token = await tx.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(rawToken) } })
            if (!token) return
            await tx.$queryRaw`SELECT id FROM auth_sessions WHERE id = ${token.sessionId} FOR UPDATE`
            await tx.authSession.updateMany({
                where: { id: token.sessionId, revokedAt: null }, data: { revokedAt: new Date() },
            })
        })
    }
}
