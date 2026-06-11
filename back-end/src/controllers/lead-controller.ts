import type { Request, Response } from 'express'

import asyncHandler from '../middlewares/asyncWrapper.js'
import { SalesPipelineSchemas } from '../schemas/sales-pipeline-schema.js'
import { LeadService } from '../services/lead-service.js'
import { responseHandler } from '../utilities/api-response.js'
import { parseZodSchema } from '../utilities/parse-zod-schema.js'
import { WebError } from '../utilities/web-errors.js'

class LeadController {
    constructor(private readonly leadService = new LeadService()) {}

    list = asyncHandler(async (req: Request, res: Response) => {
        const query = parseZodSchema(SalesPipelineSchemas.leadListQuery, req.query)
        const leads = await this.leadService.list(query)

        responseHandler(res, 200, 'Leads retrieved successfully', leads)
    })

    getById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const lead = await this.leadService.getById(id)

        responseHandler(res, 200, 'Lead retrieved successfully', lead)
    })

    create = asyncHandler(async (req: Request, res: Response) => {
        const body = parseZodSchema(SalesPipelineSchemas.leadCreate, req.body)
        const lead = await this.leadService.create(body, this.getAuthUserId(res))

        responseHandler(res, 201, 'Lead created successfully', lead)
    })

    update = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const body = parseZodSchema(SalesPipelineSchemas.leadUpdate, req.body)
        const lead = await this.leadService.update(id, body)

        responseHandler(res, 200, 'Lead updated successfully', lead)
    })

    moveStage = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const body = parseZodSchema(SalesPipelineSchemas.leadMoveStage, req.body)
        const lead = await this.leadService.moveStage(id, body)

        responseHandler(res, 200, 'Lead moved successfully', lead)
    })

    private getAuthUserId(res: Response) {
        const authUserId = res.locals.authUser?.id

        if (!authUserId) {
            throw WebError.UnAuthorized('Missing authenticated user')
        }

        return authUserId
    }
}

export { LeadController }
