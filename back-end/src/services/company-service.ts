import type { Prisma } from '@prisma/client'

import { prisma } from '../db/config.js'
import { companySelect } from '../models/company-model.js'
import type {
    CompanyCreateBody,
    CompanyListQuery,
    CompanyUpdateBody,
} from '../schemas/sales-pipeline-schema.js'
import { WebError } from '../utilities/web-errors.js'

class CompanyService {
    async list(query: CompanyListQuery) {
        const where = this.buildWhere(query)
        const skip = (query.page - 1) * query.limit

        const [companies, total] = await prisma.$transaction([
            prisma.company.findMany({
                where,
                select: companySelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take: query.limit,
            }),
            prisma.company.count({ where }),
        ])

        return {
            items: companies,
            meta: this.buildMeta(query.page, query.limit, total),
        }
    }

    async getById(id: string) {
        const company = await prisma.company.findUnique({
            where: { id },
            select: companySelect,
        })

        if (!company) {
            throw WebError.NotFound('Company was not found')
        }

        return company
    }

    async create(data: CompanyCreateBody) {
        return prisma.company.create({
            data,
            select: companySelect,
        })
    }

    async update(id: string, data: CompanyUpdateBody) {
        await this.getById(id)

        return prisma.company.update({
            where: { id },
            data,
            select: companySelect,
        })
    }

    async delete(id: string) {
        await this.getById(id)

        return prisma.company.delete({
            where: { id },
            select: companySelect,
        })
    }

    private buildWhere(query: CompanyListQuery): Prisma.CompanyWhereInput {
        if (!query.search) {
            return {}
        }

        return {
            OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { website: { contains: query.search, mode: 'insensitive' } },
                { industry: { contains: query.search, mode: 'insensitive' } },
                { country: { contains: query.search, mode: 'insensitive' } },
                { city: { contains: query.search, mode: 'insensitive' } },
            ],
        }
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

export { CompanyService }
