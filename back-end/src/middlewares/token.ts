import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

import { config } from '../config/index.js'
import { prisma } from '../db/config.js'
import { WebError } from '../utilities/web-errors.js'

const accessClaims = z.object({ sub: z.uuid(), exp: z.number().int(), iat: z.number().int() })
type AuthTokenPayload = z.infer<typeof accessClaims>

function generateToken(userId: string): string {
    return jwt.sign({}, config.jwtSecret, {
        algorithm: 'HS256', subject: userId, expiresIn: config.accessTokenSeconds,
    })
}

async function verifyToken(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization
    if (!authorization) {
        return next(new WebError(401, 'MissingTokenError', 'Authentication is required'))
    }
    const match = /^Bearer ([^\s]+)$/i.exec(authorization)
    if (!match) {
        return next(new WebError(401, 'InvalidTokenError', 'Invalid authentication token'))
    }

    let claims: AuthTokenPayload
    try {
        claims = accessClaims.parse(jwt.verify(match[1]!, config.jwtSecret, { algorithms: ['HS256'] }))
    } catch (error) {
        return next(new WebError(401,
            error instanceof jwt.TokenExpiredError ? 'AccessTokenExpired' : 'InvalidTokenError',
            'Authentication token is invalid or expired'))
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: claims.sub }, select: { id: true, email: true },
        })
        if (!user) return next(WebError.UnAuthorized('Authentication is required'))
        res.locals.authUser = user
        next()
    } catch (error) {
        next(error)
    }
}

export { generateToken, verifyToken }
export type { AuthTokenPayload }
