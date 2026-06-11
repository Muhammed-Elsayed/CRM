import { AxiosError } from 'axios'
import { z } from 'zod'

import { apiErrorResponseSchema } from './apiErrorSchemas'
import { ApiError } from './ApiError'

type NormalizeApiErrorMessages = {
  invalidResponse: string
  requestFailed: string
  networkError: string
  unknownError: string
}

function normalizeApiError(
  error: unknown,
  messages: NormalizeApiErrorMessages,
): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof z.ZodError) {
    return new ApiError(messages.invalidResponse)
  }

  if (error instanceof AxiosError) {
    if (error.response) {
      const parsedError = apiErrorResponseSchema.safeParse(error.response.data)
      const message =
        parsedError.success && parsedError.data.message
          ? parsedError.data.message
          : messages.requestFailed

      return new ApiError(message, error.response.status)
    }

    if (error.request) {
      return new ApiError(messages.networkError)
    }
  }

  return new ApiError(messages.unknownError)
}

export { normalizeApiError }
export type { NormalizeApiErrorMessages }
