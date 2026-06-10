import { AxiosError } from 'axios'
import { z } from 'zod'

import { apiErrorResponseSchema } from '../schemas/authApiSchemas'
import { AuthApiError } from './AuthApiError'

function normalizeAuthError(error: unknown): AuthApiError {
  if (error instanceof AuthApiError) {
    return error
  }

  if (error instanceof z.ZodError) {
    return new AuthApiError('The server returned an unexpected login response.')
  }

  if (error instanceof AxiosError) {
    if (error.response) {
      const parsedError = apiErrorResponseSchema.safeParse(error.response.data)
      const message =
        parsedError.success && parsedError.data.message
          ? parsedError.data.message
          : 'Login failed. Please check your email and password.'

      return new AuthApiError(message, error.response.status)
    }

    if (error.request) {
      return new AuthApiError(
        'Cannot reach the server. Please check that the backend is running.',
      )
    }
  }

  return new AuthApiError('Something went wrong. Please try again.')
}

export { normalizeAuthError }
