import type { Prisma } from '@prisma/client'

import { prisma } from '../db/config.js'
import { contactSelect } from '../models/contact-model.js'
import type {
    ContactCreateBody,
    ContactListQuery,
    ContactUpdateBody,
} from '../schemas/sales-pipeline-schema.js'
import { WebError } from '../utilities/web-errors.js'

class ContactService {
    async list(query: ContactListQuery) {
        const where = this.buildWhere(query)
        const skip = (query.page - 1) * query.limit

        const [contacts, total] = await prisma.$transaction([
            prisma.contact.findMany({
                where,
                select: contactSelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take: query.limit,
            }),
            prisma.contact.count({ where }),
        ])

        return {
            items: contacts,
            meta: this.buildMeta(query.page, query.limit, total),
        }
    }

    async getById(id: string) {
        const contact = await prisma.contact.findUnique({
            where: { id },
            select: contactSelect,
        })

        if (!contact) {
            throw WebError.NotFound('Contact was not found')
        }

        return contact
    }

    async create(data: ContactCreateBody) {
        if (data.companyId) {
            await this.ensureCompanyExists(data.companyId)
        }

        return prisma.contact.create({
            data,
            select: contactSelect,
        })
    }

    async update(id: string, data: ContactUpdateBody) {
        await this.getById(id)

        if (data.companyId) {
            await this.ensureCompanyExists(data.companyId)
        }

        return prisma.contact.update({
            where: { id },
            data,
            select: contactSelect,
        })
    }

    private async ensureCompanyExists(companyId: string) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true },
        })

        if (!company) {
            throw WebError.BadRequest('Company was not found')
        }
    }

    private buildWhere(query: ContactListQuery): Prisma.ContactWhereInput {
        const where: Prisma.ContactWhereInput = {}

        if (query.companyId) {
            where.companyId = query.companyId
        }

        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search, mode: 'insensitive' } },
                { jobTitle: { contains: query.search, mode: 'insensitive' } },
            ]
        }

        return where
    }

    private buildMeta(page: number, limit: number, total: number) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }
}

export { ContactService }
