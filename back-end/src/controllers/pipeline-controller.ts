import type { Request, Response } from 'express'

import asyncHandler from '../middlewares/asyncWrapper.js'
import { SalesPipelineSchemas } from '../schemas/sales-pipeline-schema.js'
import { PipelineService } from '../services/pipeline-service.js'
import { responseHandler } from '../utilities/api-response.js'
import { parseZodSchema } from '../utilities/parse-zod-schema.js'

class PipelineController {
    constructor(private readonly pipelineService = new PipelineService()) {}

    list = asyncHandler(async (req: Request, res: Response) => {
        const query = parseZodSchema(SalesPipelineSchemas.pipelineListQuery, req.query)
        const pipelines = await this.pipelineService.list(query)

        responseHandler(res, 200, 'Pipelines retrieved successfully', pipelines)
    })

    getDefault = asyncHandler(async (_req: Request, res: Response) => {
        const pipeline = await this.pipelineService.getDefault()

        responseHandler(res, 200, 'Default pipeline retrieved successfully', pipeline)
    })

    getStages = asyncHandler(async (req: Request, res: Response) => {
        const { pipelineId } = parseZodSchema(SalesPipelineSchemas.pipelineIdParams, req.params)
        const stages = await this.pipelineService.getStages(pipelineId)

        responseHandler(res, 200, 'Pipeline stages retrieved successfully', stages)
    })

    getBoard = asyncHandler(async (req: Request, res: Response) => {
        const query = parseZodSchema(SalesPipelineSchemas.boardQuery, req.query)
        const board = await this.pipelineService.getBoard(query)

        responseHandler(res, 200, 'Pipeline board retrieved successfully', board)
    })
}

export { PipelineController }
