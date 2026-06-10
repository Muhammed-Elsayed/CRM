import type { Request, Response } from 'express'
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

        responseHandler(res, 200, 'Login successful', loginResult)
    })

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
