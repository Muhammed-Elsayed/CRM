import { httpClient } from '@/shared/api/httpClient'
import { normalizeApiError } from '@/shared/api/normalizeApiError'

import { signInResponseSchema } from '../schemas/authApiSchemas'
import { persistAuthToken } from '../storage/authTokenStorage'
import type { SignInInput, SignInResult } from '../types'

const signInErrorMessages = {
  invalidResponse: 'The server returned an unexpected login response.',
  requestFailed: 'Login failed. Please check your email and password.',
  networkError: 'Cannot reach the server. Please check that the backend is running.',
  unknownError: 'Something went wrong. Please try again.',
}

async function signIn(input: SignInInput): Promise<SignInResult> {
  try {
    const response = await httpClient.post('/api/auth/login', input)
    const parsedResponse = signInResponseSchema.parse(response.data)
    const result = parsedResponse.data

    persistAuthToken(result.token)

    return result
  } catch (error) {
    throw normalizeApiError(error, signInErrorMessages)
  }
}

export { signIn }
