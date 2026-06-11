import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'

import { config } from '../config/index.js'
import { prisma } from '../db/config.js'
import { WebError } from '../utilities/web-errors.js'

type AuthTokenPayload = JwtPayload & {
    userId: string
    email: string
}

const tokenExpiresIn: SignOptions['expiresIn'] = '1h'

function generateToken(payload: Pick<AuthTokenPayload, 'userId' | 'email'>): string {
    if (!config.jwtSecret) {
        throw WebError.InternalServerError('JWT_SECRET is required to sign authentication tokens')
    }

    return jwt.sign(payload, config.jwtSecret, { expiresIn: tokenExpiresIn })
}

async function verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
        const authorization = req.headers.authorization

        if (!authorization) {
            throw new WebError(401, 'MissingTokenError', 'Missing authentication token, please login first')
        }

        const [scheme, token] = authorization.split(' ')

        if (scheme !== 'Bearer' || !token) {
            throw new WebError(401, 'InvalidTokenError', 'Authentication token must use the Bearer scheme')
        }

        if (!config.jwtSecret) {
            throw WebError.InternalServerError('JWT_SECRET is required to verify authentication tokens')
        }

        const decodedToken = jwt.verify(token, config.jwtSecret) as AuthTokenPayload

        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId },
            select: { id: true, email: true },
        })

        if (!user) {
            throw WebError.Forbidden('Forbidden, you are not authorized')
        }

        res.locals.authUser = {
            id: user.id,
            email: user.email,
        }

        next()
    } catch (error) {
        if (error instanceof WebError) {
            return next(error)
        }

        next(
            new WebError(
                401,
                'InvalidTokenError',
                'The provided token is invalid or expired, please login first',
            ),
        )
    }
}

export { generateToken, verifyToken }
export type { AuthTokenPayload }
