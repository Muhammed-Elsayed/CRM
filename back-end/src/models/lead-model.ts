import type { Lead, Prisma } from '@prisma/client'

import { companySelect } from './company-model.js'
import { contactSelect } from './contact-model.js'

const leadStageSelect = {
    id: true,
    pipelineId: true,
    name: true,
    order: true,
    type: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.PipelineStageSelect

const leadSelect = {
    id: true,
    title: true,
    description: true,
    companyId: true,
    contactId: true,
    ownerId: true,
    stageId: true,
    value: true,
    source: true,
    priority: true,
    expectedCloseDate: true,
    closedAt: true,
    createdAt: true,
    updatedAt: true,
    company: {
        select: companySelect,
    },
    contact: {
        select: contactSelect,
    },
    stage: {
        select: leadStageSelect,
    },
} satisfies Prisma.LeadSelect

const leadBoardSelect = {
    id: true,
    title: true,
    description: true,
    companyId: true,
    contactId: true,
    ownerId: true,
    stageId: true,
    value: true,
    source: true,
    priority: true,
    expectedCloseDate: true,
    closedAt: true,
    createdAt: true,
    updatedAt: true,
    company: {
        select: companySelect,
    },
    contact: {
        select: contactSelect,
    },
} satisfies Prisma.LeadSelect

type LeadModel = Lead
type PublicLeadModel = Prisma.LeadGetPayload<{ select: typeof leadSelect }>
type BoardLeadModel = Prisma.LeadGetPayload<{ select: typeof leadBoardSelect }>

export { leadBoardSelect, leadSelect, leadStageSelect }
export type { BoardLeadModel, LeadModel, PublicLeadModel }
