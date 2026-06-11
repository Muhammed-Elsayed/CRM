import type { Request, Response } from 'express'

import asyncHandler from '../middlewares/asyncWrapper.js'
import { SalesPipelineSchemas } from '../schemas/sales-pipeline-schema.js'
import { CompanyService } from '../services/company-service.js'
import { responseHandler } from '../utilities/api-response.js'
import { parseZodSchema } from '../utilities/parse-zod-schema.js'

class CompanyController {
    constructor(private readonly companyService = new CompanyService()) {}

    list = asyncHandler(async (req: Request, res: Response) => {
        const query = parseZodSchema(SalesPipelineSchemas.companyListQuery, req.query)
        const companies = await this.companyService.list(query)

        responseHandler(res, 200, 'Companies retrieved successfully', companies)
    })

    getById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const company = await this.companyService.getById(id)

        responseHandler(res, 200, 'Company retrieved successfully', company)
    })

    create = asyncHandler(async (req: Request, res: Response) => {
        const body = parseZodSchema(SalesPipelineSchemas.companyCreate, req.body)
        const company = await this.companyService.create(body)

        responseHandler(res, 201, 'Company created successfully', company)
    })

    update = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const body = parseZodSchema(SalesPipelineSchemas.companyUpdate, req.body)
        const company = await this.companyService.update(id, body)

        responseHandler(res, 200, 'Company updated successfully', company)
    })

    delete = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const company = await this.companyService.delete(id)

        responseHandler(res, 200, 'Company deleted successfully', company)
    })
}

export { CompanyController }
