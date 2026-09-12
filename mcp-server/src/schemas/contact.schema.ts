import { z } from 'zod'
import { companySchema } from './company.schema.js'

export const contactSchema = z.object({
  id: z.string(), companyId: z.string().nullable(),
  firstName: z.string(), lastName: z.string(),
  email: z.string().nullable(), phone: z.string().nullable(), jobTitle: z.string().nullable(),
  createdAt: z.string(), updatedAt: z.string(),
  company: companySchema.nullable(),
})
export const allContactsSchema = z.object({ contacts: z.array(contactSchema), total: z.number().int().nonnegative() })
export const contactResultSchema = z.object({ contact: contactSchema })
