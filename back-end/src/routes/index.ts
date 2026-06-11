import { Router } from 'express'

import { authRoutes } from './auth-routes.js'
import { companyRoutes } from './company-routes.js'
import { contactRoutes } from './contact-routes.js'
import { docsRoutes } from './docs-routes.js'
import { leadRoutes } from './lead-routes.js'
import { pipelineRoutes } from './pipeline-routes.js'

class AppRoutes {
    readonly router = Router()

    constructor() {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use('/auth', authRoutes.router)
        this.router.use('/docs', docsRoutes.router)
        this.router.use('/companies', companyRoutes.router)
        this.router.use('/contacts', contactRoutes.router)
        this.router.use('/leads', leadRoutes.router)
        this.router.use('/pipelines', pipelineRoutes.router)
    }
}

const appRoutes = new AppRoutes()

export { appRoutes, AppRoutes }
