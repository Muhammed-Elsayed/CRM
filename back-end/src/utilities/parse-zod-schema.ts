import { ZodError, type ZodType } from 'zod'

import { WebError } from './web-errors.js'

function parseZodSchema<T>(schema: ZodType<T>, value: unknown): T {
    try {
        return schema.parse(value)
    } catch (error) {
        if (error instanceof ZodError) {
            const message = error.issues.map((issue) => issue.message).join(', ')
            throw WebError.BadRequest(message)
        }

        throw error
    }
}

export { parseZodSchema }
