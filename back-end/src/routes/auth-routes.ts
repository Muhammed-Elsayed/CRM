import { Router } from 'express'

import { AuthController } from '../controllers/auth-controller.js'

class AuthRoutes {
    readonly router = Router()

    constructor(private readonly authController = new AuthController()) {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.post('/login', this.authController.login)
    }
}

const authRoutes = new AuthRoutes()

export { AuthRoutes, authRoutes }
