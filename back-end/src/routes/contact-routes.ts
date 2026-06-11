import { Router } from 'express'

import { ContactController } from '../controllers/contact-controller.js'
import { verifyToken } from '../middlewares/token.js'

class ContactRoutes {
    readonly router = Router()

    constructor(private readonly contactController = new ContactController()) {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use(verifyToken)
        this.router.get('/', this.contactController.list)
        this.router.post('/', this.contactController.create)
        this.router.get('/:id', this.contactController.getById)
        this.router.patch('/:id', this.contactController.update)
    }
}

const contactRoutes = new ContactRoutes()

export { ContactRoutes, contactRoutes }
