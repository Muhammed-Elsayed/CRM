import { normalizeAuthError } from '../errors/normalizeAuthError'
import { signInResponseSchema } from '../schemas/authApiSchemas'
import { persistAuthToken } from '../storage/authTokenStorage'
import type { SignInInput, SignInResult } from '../types'
import { authHttpClient } from './authHttpClient'

async function signIn(input: SignInInput): Promise<SignInResult> {
  try {
    const response = await authHttpClient.post('/api/auth/login', input)
    const parsedResponse = signInResponseSchema.parse(response.data)
    const result = parsedResponse.data

    persistAuthToken(result.token)

    return result
  } catch (error) {
    throw normalizeAuthError(error)
  }
}

export { signIn }
