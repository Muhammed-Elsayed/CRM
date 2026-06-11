import { Router } from 'express'

import { PipelineController } from '../controllers/pipeline-controller.js'
import { verifyToken } from '../middlewares/token.js'

class PipelineRoutes {
    readonly router = Router()

    constructor(private readonly pipelineController = new PipelineController()) {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.use(verifyToken)
        this.router.get('/', this.pipelineController.list)
        this.router.get('/default', this.pipelineController.getDefault)
        this.router.get('/board', this.pipelineController.getBoard)
        this.router.get('/:pipelineId/stages', this.pipelineController.getStages)
    }
}

const pipelineRoutes = new PipelineRoutes()

export { PipelineRoutes, pipelineRoutes }
