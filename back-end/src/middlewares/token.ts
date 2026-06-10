import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'

import { config } from '../config/index.js'
import { prisma } from '../db/config.js'
import { WebError } from '../utilities/web-errors.js'

type AuthTokenPayload = JwtPayload & {
    userId: string
    email: string
}

class JwtTokenService {
    private readonly expiresIn: SignOptions['expiresIn'] = '1h'

    sign(payload: Pick<AuthTokenPayload, 'userId' | 'email'>): string {
        if (!config.jwtSecret) {
            throw WebError.InternalServerError('JWT_SECRET is required to sign authentication tokens')
        }

        return jwt.sign(payload, config.jwtSecret, { expiresIn: this.expiresIn })
    }

    verify(token: string): AuthTokenPayload {
        if (!config.jwtSecret) {
            throw WebError.InternalServerError('JWT_SECRET is required to verify authentication tokens')
        }

        try {
            return jwt.verify(token, config.jwtSecret) as AuthTokenPayload
        } catch {
            throw new WebError(
                401,
                'InvalidTokenError',
                'The provided token is invalid or expired, please login first',
            )
        }
    }
}

class TokenMiddleware {
    constructor(private readonly tokenService = new JwtTokenService()) {}

    verifyToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rawToken = this.extractToken(req)
            const decodedToken = this.tokenService.verify(rawToken)

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
            next(error)
        }
    }

    private extractToken(req: Request): string {
        const authorization = req.headers.authorization

        if (!authorization) {
            throw new WebError(401, 'MissingTokenError', 'Missing authentication token, please login first')
        }

        const [scheme, token] = authorization.split(' ')

        if (scheme !== 'Bearer' || !token) {
            throw new WebError(401, 'InvalidTokenError', 'Authentication token must use the Bearer scheme')
        }

        return token
    }
}

const jwtTokenService = new JwtTokenService()
const tokenMiddleware = new TokenMiddleware(jwtTokenService)

const generateToken = (payload: Pick<AuthTokenPayload, 'userId' | 'email'>) => jwtTokenService.sign(payload)
const verifyToken = tokenMiddleware.verifyToken

export { generateToken, JwtTokenService, TokenMiddleware, verifyToken }
export type { AuthTokenPayload }
