import { Router } from 'express'

import { CompanyController } from '../controllers/company-controller.js'
import { verifyToken } from '../middlewares/token.js'

class CompanyRoutes {
    readonly router = Router()

    constructor(private readonly companyController = new CompanyController()) {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use(verifyToken)
        this.router.get('/', this.companyController.list)
        this.router.post('/', this.companyController.create)
        this.router.get('/:id', this.companyController.getById)
        this.router.patch('/:id', this.companyController.update)
    }
}

const companyRoutes = new CompanyRoutes()

export { CompanyRoutes, companyRoutes }
