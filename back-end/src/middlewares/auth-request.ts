import type { CookieOptions, NextFunction, Request, Response } from 'express'
import { config } from '../config/index.js'
import { WebError } from '../utilities/web-errors.js'

export const refreshCookieName = 'crm_refresh'
export const refreshCookieOptions: CookieOptions = {
    httpOnly: true, secure: config.secureAuthCookie, sameSite: 'lax', path: '/api/auth',
}

export function authRequest(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Cache-Control', 'no-store')
    const origin = req.get('Origin')
    if (req.get('X-CRM-Auth') !== '1' || (origin !== undefined && !config.corsOrigins.includes(origin))) {
        return next(WebError.Forbidden('Authentication request origin or header is not allowed'))
    }
    next()
}

export function readRefreshCookie(req: Request): string | undefined {
    const value: unknown = req.cookies?.[refreshCookieName]
    return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined
}
