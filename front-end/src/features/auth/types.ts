type SignInInput = {
  email: string
  password: string
}

type AuthUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

type SignInResult = {
  user: AuthUser
  token: string
}

export type { AuthUser, SignInInput, SignInResult }
