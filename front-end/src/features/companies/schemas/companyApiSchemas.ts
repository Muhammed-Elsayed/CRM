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

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

const companiesResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    items: z.array(companySchema),
    meta: paginationMetaSchema,
  }),
  timestamp: z.string(),
})

const companyResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: companySchema,
  timestamp: z.string(),
})

export { companiesResponseSchema, companyResponseSchema }
export type Company = z.infer<typeof companySchema>
export type CompanyListMeta = z.infer<typeof paginationMetaSchema>
