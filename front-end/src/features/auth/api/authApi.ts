import { loginSession } from '@/shared/auth/authSession'
import { normalizeApiError } from '@/shared/api/normalizeApiError'

import type { SignInInput, SignInResult } from '../types'

const signInErrorMessages = {
  invalidResponse: 'The server returned an unexpected login response.',
  requestFailed: 'Login failed. Please check your email and password.',
  networkError: 'Cannot reach the server. Please check that the backend is running.',
  unknownError: 'Something went wrong. Please try again.',
}

async function signIn(input: SignInInput): Promise<SignInResult> {
  try {
    return await loginSession(input)
  } catch (error) {
    throw normalizeApiError(error, signInErrorMessages)
  }
}

export { signIn }
