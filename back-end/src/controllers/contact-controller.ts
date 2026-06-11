import type { Request, Response } from 'express'

import asyncHandler from '../middlewares/asyncWrapper.js'
import { SalesPipelineSchemas } from '../schemas/sales-pipeline-schema.js'
import { ContactService } from '../services/contact-service.js'
import { responseHandler } from '../utilities/api-response.js'
import { parseZodSchema } from '../utilities/parse-zod-schema.js'

class ContactController {
    constructor(private readonly contactService = new ContactService()) {}

    list = asyncHandler(async (req: Request, res: Response) => {
        const query = parseZodSchema(SalesPipelineSchemas.contactListQuery, req.query)
        const contacts = await this.contactService.list(query)

        responseHandler(res, 200, 'Contacts retrieved successfully', contacts)
    })

    getById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const contact = await this.contactService.getById(id)

        responseHandler(res, 200, 'Contact retrieved successfully', contact)
    })

    create = asyncHandler(async (req: Request, res: Response) => {
        const body = parseZodSchema(SalesPipelineSchemas.contactCreate, req.body)
        const contact = await this.contactService.create(body)

        responseHandler(res, 201, 'Contact created successfully', contact)
    })

    update = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const body = parseZodSchema(SalesPipelineSchemas.contactUpdate, req.body)
        const contact = await this.contactService.update(id, body)

        responseHandler(res, 200, 'Contact updated successfully', contact)
    })

    delete = asyncHandler(async (req: Request, res: Response) => {
        const { id } = parseZodSchema(SalesPipelineSchemas.idParams, req.params)
        const contact = await this.contactService.delete(id)

        responseHandler(res, 200, 'Contact deleted successfully', contact)
    })
}

export { ContactController }
