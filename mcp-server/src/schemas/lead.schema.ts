import { z } from 'zod'
import { companySchema } from './company.schema.js'
import { contactSchema } from './contact.schema.js'
import { pipelineStageSchema } from './pipeline.schema.js'

export const leadSchema = z.object({
  id: z.string(), title: z.string(), description: z.string().nullable(),
  companyId: z.string().nullable(), contactId: z.string().nullable(), ownerId: z.string(), stageId: z.string(),
  // Prisma Decimal is serialized as a string; preserve monetary precision.
  value: z.string().regex(/^-?\d+(?:\.\d+)?$/),
  source: z.enum(['WEBSITE', 'REFERRAL', 'EMAIL', 'CALL', 'SOCIAL_MEDIA', 'AFFILIATE', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  expectedCloseDate: z.string().nullable(), closedAt: z.string().nullable(),
  createdAt: z.string(), updatedAt: z.string(),
  company: companySchema.nullable(), contact: contactSchema.nullable(), stage: pipelineStageSchema,
  owner: z.object({ id: z.string(), name: z.string(), email: z.string(), createdAt: z.string() }).nullable(),
})
export const allLeadsSchema = z.object({ leads: z.array(leadSchema), total: z.number().int().nonnegative() })
export const leadResultSchema = z.object({ lead: leadSchema })
