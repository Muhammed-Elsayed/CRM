import type { Request, Response } from 'express'
import { readRefreshCookie, refreshCookieName, refreshCookieOptions } from '../middlewares/auth-request.js'
import { ZodError } from 'zod'

import asyncHandler from '../middlewares/asyncWrapper.js'
import { AuthSchemas } from '../schemas/auth-schema.js'
import { AuthService } from '../services/auth-service.js'
import { responseHandler } from '../utilities/api-response.js'
import { WebError } from '../utilities/web-errors.js'

class AuthController {
    constructor(private readonly authService = new AuthService()) {}

    login = asyncHandler(async (req: Request, res: Response) => {
        const credentials = this.parseLoginBody(req.body)
        const loginResult = await this.authService.login(credentials)

        this.sendSession(res, loginResult, 'Login successful')
    })

    refresh = asyncHandler(async (req: Request, res: Response) => {
        try {
            this.sendSession(res, await this.authService.refresh(readRefreshCookie(req)), 'Session refreshed')
        } catch (error) {
            if (error instanceof WebError && error.statusCode === 401) {
                res.clearCookie(refreshCookieName, refreshCookieOptions)
            }
            throw error
        }
    })

    logout = asyncHandler(async (req: Request, res: Response) => {
        await this.authService.logout(readRefreshCookie(req))
        res.clearCookie(refreshCookieName, refreshCookieOptions)
        responseHandler(res, 200, 'Signed out')
    })

    private sendSession(res: Response, result: Awaited<ReturnType<AuthService['login']>>, message: string) {
        const { refreshToken, expiresAt, user, token } = result
        res.cookie(refreshCookieName, refreshToken, { ...refreshCookieOptions, expires: expiresAt })
        responseHandler(res, 200, message, { user, token })
    }

    private parseLoginBody(body: unknown) {
        try {
            return AuthSchemas.login.parse(body)
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map((issue) => issue.message).join(', ')
                throw WebError.BadRequest(message)
            }

            throw error
        }
    }
}

export { AuthController }
