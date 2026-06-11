import { Router } from 'express'

import { openApiDocument } from '../docs/openapi.js'

class DocsRoutes {
    readonly router = Router()

    constructor() {
        this.registerRoutes()
    }

    private registerRoutes() {
        this.router.get('/openapi.json', (_req, res) => {
            res.json(openApiDocument)
        })
    }
}

const docsRoutes = new DocsRoutes()

export { DocsRoutes, docsRoutes }
