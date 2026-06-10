import { z } from 'zod'

const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
})

const signInResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    user: authUserSchema,
    token: z.string().min(1),
  }),
  timestamp: z.string(),
})

const apiErrorResponseSchema = z.object({
  statusCode: z.number().optional(),
  statusText: z.string().optional(),
  message: z.string().optional(),
})

export { apiErrorResponseSchema, authUserSchema, signInResponseSchema }
