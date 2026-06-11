import { z } from 'zod'

const nullableStringSchema = z.string().nullable().optional()

const companyOptionSchema = z.object({
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
  company: companyOptionSchema.nullable().optional(),
})

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

const contactsResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    items: z.array(contactSchema),
    meta: paginationMetaSchema,
  }),
  timestamp: z.string(),
})

const contactResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: contactSchema,
  timestamp: z.string(),
})

const companyOptionsResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    items: z.array(companyOptionSchema),
    meta: paginationMetaSchema,
  }),
  timestamp: z.string(),
})

export {
  companyOptionsResponseSchema,
  contactResponseSchema,
  contactsResponseSchema,
}

export type CompanyOption = z.infer<typeof companyOptionSchema>
export type Contact = z.infer<typeof contactSchema>
export type ContactListMeta = z.infer<typeof paginationMetaSchema>
