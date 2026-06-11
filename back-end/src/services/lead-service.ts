import { PipelineStageType, type Prisma } from '@prisma/client'

import { prisma } from '../db/config.js'
import { leadSelect, type PublicLeadModel } from '../models/lead-model.js'
import { publicUserSelect, type PublicUserModel } from '../models/user-model.js'
import type {
    LeadCreateBody,
    LeadListQuery,
    LeadMoveStageBody,
    LeadUpdateBody,
} from '../schemas/sales-pipeline-schema.js'
import { WebError } from '../utilities/web-errors.js'

type LeadWithOwner = PublicLeadModel & {
    owner: PublicUserModel | null
}

class LeadService {
    async list(query: LeadListQuery) {
        const where = this.buildWhere(query)
        const skip = (query.page - 1) * query.limit

        const [leads, total] = await prisma.$transaction([
            prisma.lead.findMany({
                where,
                select: leadSelect,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: query.limit,
            }),
            prisma.lead.count({ where }),
        ])

        return {
            items: await this.attachOwners(leads),
            meta: this.buildMeta(query.page, query.limit, total),
        }
    }

    async getById(id: string): Promise<LeadWithOwner> {
        const lead = await prisma.lead.findUnique({
            where: { id },
            select: leadSelect,
        })

        if (!lead) {
            throw WebError.NotFound('Lead was not found')
        }

        const [leadWithOwner] = await this.attachOwners([lead])
        return leadWithOwner
    }

    async create(data: LeadCreateBody, authUserId: string): Promise<LeadWithOwner> {
        await this.ensureCompanyAndContactExist(data.companyId, data.contactId)

        const ownerId = data.ownerId ?? authUserId
        await this.ensureOwnerExists(ownerId)

        const stage = await this.ensureStageExists(data.stageId)
        const closedAt = this.shouldCloseForStage(stage.type) ? new Date() : undefined

        const lead = await prisma.lead.create({
            data: {
                ...data,
                ownerId,
                closedAt,
            },
            select: leadSelect,
        })

        const [leadWithOwner] = await this.attachOwners([lead])
        return leadWithOwner
    }

    async update(id: string, data: LeadUpdateBody): Promise<LeadWithOwner> {
        const existingLead = await prisma.lead.findUnique({
            where: { id },
            select: {
                id: true,
                companyId: true,
                contactId: true,
                closedAt: true,
            },
        })

        if (!existingLead) {
            throw WebError.NotFound('Lead was not found')
        }

        const finalCompanyId = data.companyId === undefined ? existingLead.companyId : data.companyId
        const finalContactId = data.contactId === undefined ? existingLead.contactId : data.contactId

        this.ensureLeadHasAssociation(finalCompanyId, finalContactId)
        await this.ensureCompanyAndContactExist(finalCompanyId ?? undefined, finalContactId ?? undefined)

        if (data.ownerId) {
            await this.ensureOwnerExists(data.ownerId)
        }

        const stage = data.stageId ? await this.ensureStageExists(data.stageId) : null
        const closedAt =
            data.closedAt !== undefined
                ? data.closedAt
                : stage && this.shouldCloseForStage(stage.type) && !existingLead.closedAt
                  ? new Date()
                  : undefined

        const lead = await prisma.lead.update({
            where: { id },
            data: {
                ...data,
                closedAt,
            },
            select: leadSelect,
        })

        const [leadWithOwner] = await this.attachOwners([lead])
        return leadWithOwner
    }

    async moveStage(id: string, data: LeadMoveStageBody): Promise<LeadWithOwner> {
        const existingLead = await prisma.lead.findUnique({
            where: { id },
            select: {
                id: true,
                closedAt: true,
            },
        })

        if (!existingLead) {
            throw WebError.NotFound('Lead was not found')
        }

        const stage = await this.ensureStageExists(data.stageId)
        const closedAt = this.shouldCloseForStage(stage.type) && !existingLead.closedAt ? new Date() : undefined

        const lead = await prisma.lead.update({
            where: { id },
            data: {
                stageId: data.stageId,
                closedAt,
            },
            select: leadSelect,
        })

        const [leadWithOwner] = await this.attachOwners([lead])
        return leadWithOwner
    }

    private async ensureCompanyAndContactExist(companyId?: string, contactId?: string) {
        if (companyId) {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true },
            })

            if (!company) {
                throw WebError.BadRequest('Company was not found')
            }
        }

        if (contactId) {
            const contact = await prisma.contact.findUnique({
                where: { id: contactId },
                select: { id: true },
            })

            if (!contact) {
                throw WebError.BadRequest('Contact was not found')
            }
        }
    }

    private ensureLeadHasAssociation(companyId: string | null, contactId: string | null) {
        if (!companyId && !contactId) {
            throw WebError.BadRequest('A lead must be connected to a company, a contact, or both')
        }
    }

    private async ensureOwnerExists(ownerId: string) {
        const owner = await prisma.user.findUnique({
            where: { id: ownerId },
            select: { id: true },
        })

        if (!owner) {
            throw WebError.BadRequest('Lead owner was not found')
        }
    }

    private async ensureStageExists(stageId: string) {
        const stage = await prisma.pipelineStage.findUnique({
            where: { id: stageId },
            select: {
                id: true,
                type: true,
            },
        })

        if (!stage) {
            throw WebError.BadRequest('Pipeline stage was not found')
        }

        return stage
    }

    private shouldCloseForStage(type: PipelineStageType) {
        return type === PipelineStageType.WON || type === PipelineStageType.LOST
    }

    private buildWhere(query: LeadListQuery): Prisma.LeadWhereInput {
        const where: Prisma.LeadWhereInput = {}

        if (query.companyId) {
            where.companyId = query.companyId
        }

        if (query.contactId) {
            where.contactId = query.contactId
        }

        if (query.stageId) {
            where.stageId = query.stageId
        }

        if (query.ownerId) {
            where.ownerId = query.ownerId
        }

        if (query.priority) {
            where.priority = query.priority
        }

        if (query.source) {
            where.source = query.source
        }

        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { company: { name: { contains: query.search, mode: 'insensitive' } } },
                { contact: { firstName: { contains: query.search, mode: 'insensitive' } } },
                { contact: { lastName: { contains: query.search, mode: 'insensitive' } } },
                { contact: { email: { contains: query.search, mode: 'insensitive' } } },
            ]
        }

        return where
    }

    private async attachOwners(leads: PublicLeadModel[]): Promise<LeadWithOwner[]> {
        const ownerIds = Array.from(new Set(leads.map((lead) => lead.ownerId)))

        if (ownerIds.length === 0) {
            return leads.map((lead) => ({
                ...lead,
                owner: null,
            }))
        }

        const owners = await prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: publicUserSelect,
        })
        const ownersById = new Map(owners.map((owner) => [owner.id, owner]))

        return leads.map((lead) => ({
            ...lead,
            owner: ownersById.get(lead.ownerId) ?? null,
        }))
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

export { LeadService }
