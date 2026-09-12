import { Router } from 'express'

import { authRequest } from '../middlewares/auth-request.js'
import { AuthController } from '../controllers/auth-controller.js'

class AuthRoutes {
    readonly router = Router()

    constructor(private readonly authController = new AuthController()) {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use(authRequest)
        this.router.post('/login', this.authController.login)
        this.router.post('/refresh', this.authController.refresh)
        this.router.post('/logout', this.authController.logout)
    }
}

const authRoutes = new AuthRoutes()

export { AuthRoutes, authRoutes }
