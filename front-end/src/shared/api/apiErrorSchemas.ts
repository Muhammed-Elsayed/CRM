import { z } from 'zod'

const apiErrorResponseSchema = z.object({
  statusCode: z.number().optional(),
  statusText: z.string().optional(),
  message: z.string().optional(),
})

export { apiErrorResponseSchema }
