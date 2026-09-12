import { z } from 'zod'

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  size: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const allCompaniesSchema = z.object({
  companies: z.array(companySchema),
  total: z.number().int().nonnegative(),
})

export type Company = z.infer<typeof companySchema>

export const companyResultSchema = z.object({ company: companySchema })
