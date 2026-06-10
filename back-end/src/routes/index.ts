import { Router } from 'express'

import { authRoutes } from './auth-routes.js'

class AppRoutes {
    readonly router = Router()

    constructor() {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use('/auth', authRoutes.router)
    }
}

const appRoutes = new AppRoutes()

export { appRoutes, AppRoutes }
