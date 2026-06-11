import { Router } from 'express'

import { LeadController } from '../controllers/lead-controller.js'
import { verifyToken } from '../middlewares/token.js'

class LeadRoutes {
    readonly router = Router()

    constructor(private readonly leadController = new LeadController()) {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use(verifyToken)
        this.router.get('/', this.leadController.list)
        this.router.post('/', this.leadController.create)
        this.router.get('/:id', this.leadController.getById)
        this.router.patch('/:id', this.leadController.update)
        this.router.patch('/:id/stage', this.leadController.moveStage)
        this.router.delete('/:id', this.leadController.delete)
    }
}

const leadRoutes = new LeadRoutes()

export { LeadRoutes, leadRoutes }
