import type { SignInInput, SignInResult } from '../types'

async function signIn(input: SignInInput): Promise<SignInResult> {
  void input

  return { ok: true }
}

export { signIn }
