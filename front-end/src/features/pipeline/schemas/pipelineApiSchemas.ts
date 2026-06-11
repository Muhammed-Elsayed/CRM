import { z } from 'zod'

const nullableStringSchema = z.string().nullable().optional()

const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  website: nullableStringSchema,
  industry: nullableStringSchema,
  size: nullableStringSchema,
  country: nullableStringSchema,
  city: nullableStringSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const contactSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: nullableStringSchema,
  phone: nullableStringSchema,
  jobTitle: nullableStringSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  company: companySchema.nullable().optional(),
})

const ownerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.string().optional(),
})

const pipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const pipelineStageSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  name: z.string(),
  order: z.number(),
  type: z.enum(['OPEN', 'WON', 'LOST']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const leadSourceSchema = z.enum([
  'WEBSITE',
  'REFERRAL',
  'EMAIL',
  'CALL',
  'SOCIAL_MEDIA',
  'AFFILIATE',
  'OTHER',
])

const leadPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

const leadSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  ownerId: z.string(),
  stageId: z.string(),
  value: z.coerce.number(),
  source: leadSourceSchema,
  priority: leadPrioritySchema,
  expectedCloseDate: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  company: companySchema.nullable().optional(),
  contact: contactSchema.nullable().optional(),
  owner: ownerSchema.nullable().optional(),
})

const boardStageSchema = pipelineStageSchema.extend({
  leads: z.array(leadSchema),
})

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

const listResponseDataSchema = <ItemSchema extends z.ZodType>(
  itemSchema: ItemSchema,
) =>
  z.object({
    items: z.array(itemSchema),
    meta: paginationMetaSchema,
  })

const apiResponseSchema = <DataSchema extends z.ZodType>(
  dataSchema: DataSchema,
) =>
  z.object({
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema,
    timestamp: z.string(),
  })

const pipelineBoardResponseSchema = apiResponseSchema(
  z.object({
    pipeline: pipelineSchema,
    stages: z.array(boardStageSchema),
  }),
)

const companiesResponseSchema = apiResponseSchema(
  listResponseDataSchema(companySchema),
)

const contactsResponseSchema = apiResponseSchema(
  listResponseDataSchema(contactSchema),
)

const leadResponseSchema = apiResponseSchema(leadSchema)

export {
  companiesResponseSchema,
  contactsResponseSchema,
  leadPrioritySchema,
  leadResponseSchema,
  leadSourceSchema,
  pipelineBoardResponseSchema,
}

export type BoardStage = z.infer<typeof boardStageSchema>
export type Company = z.infer<typeof companySchema>
export type Contact = z.infer<typeof contactSchema>
export type Lead = z.infer<typeof leadSchema>
export type LeadPriority = z.infer<typeof leadPrioritySchema>
export type LeadSource = z.infer<typeof leadSourceSchema>
export type Pipeline = z.infer<typeof pipelineSchema>
export type PipelineBoard = z.infer<
  typeof pipelineBoardResponseSchema
>['data']
