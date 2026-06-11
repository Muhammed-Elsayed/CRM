import { z } from 'zod'

const leadSourceValues = ['WEBSITE', 'REFERRAL', 'EMAIL', 'CALL', 'SOCIAL_MEDIA', 'AFFILIATE', 'OTHER'] as const
const leadPriorityValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

const optionalTrimmedString = z.string().trim().min(1).optional()
const nullableTrimmedString = z.string().trim().min(1).nullable().optional()
const emptyStringToUndefined = (value: unknown) => (value === '' ? undefined : value)
const idSchema = z.preprocess(emptyStringToUndefined, z.string().trim().uuid())
const optionalIdSchema = z.preprocess(emptyStringToUndefined, z.string().trim().uuid().optional())
const optionalSearchSchema = z.preprocess(emptyStringToUndefined, z.string().trim().optional())
const optionalLeadSourceSchema = z.preprocess(emptyStringToUndefined, z.enum(leadSourceValues).optional())
const optionalLeadPrioritySchema = z.preprocess(emptyStringToUndefined, z.enum(leadPriorityValues).optional())

const paginationQuery = z.object({
    page: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().default(1)),
    limit: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().max(100).default(20)),
    search: optionalSearchSchema,
})

class SalesPipelineSchemas {
    static readonly idParams = z.object({
        id: idSchema,
    })

    static readonly companyListQuery = paginationQuery

    static readonly companyCreate = z.object({
        name: z.string().trim().min(1),
        website: optionalTrimmedString,
        industry: optionalTrimmedString,
        size: optionalTrimmedString,
        country: optionalTrimmedString,
        city: optionalTrimmedString,
    })

    static readonly companyUpdate = z.object({
        name: optionalTrimmedString,
        website: nullableTrimmedString,
        industry: nullableTrimmedString,
        size: nullableTrimmedString,
        country: nullableTrimmedString,
        city: nullableTrimmedString,
    })

    static readonly contactListQuery = paginationQuery.extend({
        companyId: optionalIdSchema,
    })

    static readonly contactCreate = z.object({
        companyId: optionalIdSchema,
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        email: z.string().trim().email().optional(),
        phone: optionalTrimmedString,
        jobTitle: optionalTrimmedString,
    })

    static readonly contactUpdate = z.object({
        companyId: idSchema.nullable().optional(),
        firstName: optionalTrimmedString,
        lastName: optionalTrimmedString,
        email: z.string().trim().email().nullable().optional(),
        phone: nullableTrimmedString,
        jobTitle: nullableTrimmedString,
    })

    static readonly pipelineListQuery = z.object({
        includeStages: z.preprocess(emptyStringToUndefined, z.coerce.boolean().default(true)),
    })

    static readonly pipelineIdParams = z.object({
        pipelineId: idSchema,
    })

    static readonly boardQuery = z.object({
        pipelineId: optionalIdSchema,
    })

    static readonly leadListQuery = paginationQuery.extend({
        companyId: optionalIdSchema,
        contactId: optionalIdSchema,
        stageId: optionalIdSchema,
        ownerId: optionalIdSchema,
        priority: optionalLeadPrioritySchema,
        source: optionalLeadSourceSchema,
    })

    static readonly leadCreate = z
        .object({
            title: z.string().trim().min(1),
            description: optionalTrimmedString,
            companyId: idSchema.optional(),
            contactId: idSchema.optional(),
            ownerId: idSchema.optional(),
            stageId: idSchema,
            value: z.coerce.number().nonnegative().default(0),
            source: z.enum(leadSourceValues).default('OTHER'),
            priority: z.enum(leadPriorityValues).default('MEDIUM'),
            expectedCloseDate: z.coerce.date().optional(),
        })
        .refine((lead) => lead.companyId || lead.contactId, {
            message: 'A lead must be connected to a company, a contact, or both',
        })

    static readonly leadUpdate = z.object({
        title: optionalTrimmedString,
        description: nullableTrimmedString,
        companyId: idSchema.nullable().optional(),
        contactId: idSchema.nullable().optional(),
        ownerId: idSchema.optional(),
        stageId: idSchema.optional(),
        value: z.coerce.number().nonnegative().optional(),
        source: z.enum(leadSourceValues).optional(),
        priority: z.enum(leadPriorityValues).optional(),
        expectedCloseDate: z.coerce.date().nullable().optional(),
        closedAt: z.coerce.date().nullable().optional(),
    })

    static readonly leadMoveStage = z.object({
        stageId: idSchema,
    })
}

type CompanyListQuery = z.infer<typeof SalesPipelineSchemas.companyListQuery>
type CompanyCreateBody = z.infer<typeof SalesPipelineSchemas.companyCreate>
type CompanyUpdateBody = z.infer<typeof SalesPipelineSchemas.companyUpdate>
type ContactListQuery = z.infer<typeof SalesPipelineSchemas.contactListQuery>
type ContactCreateBody = z.infer<typeof SalesPipelineSchemas.contactCreate>
type ContactUpdateBody = z.infer<typeof SalesPipelineSchemas.contactUpdate>
type PipelineListQuery = z.infer<typeof SalesPipelineSchemas.pipelineListQuery>
type BoardQuery = z.infer<typeof SalesPipelineSchemas.boardQuery>
type LeadListQuery = z.infer<typeof SalesPipelineSchemas.leadListQuery>
type LeadCreateBody = z.infer<typeof SalesPipelineSchemas.leadCreate>
type LeadUpdateBody = z.infer<typeof SalesPipelineSchemas.leadUpdate>
type LeadMoveStageBody = z.infer<typeof SalesPipelineSchemas.leadMoveStage>

export { SalesPipelineSchemas }
export type {
    BoardQuery,
    CompanyCreateBody,
    CompanyListQuery,
    CompanyUpdateBody,
    ContactCreateBody,
    ContactListQuery,
    ContactUpdateBody,
    LeadCreateBody,
    LeadListQuery,
    LeadMoveStageBody,
    LeadUpdateBody,
    PipelineListQuery,
}
