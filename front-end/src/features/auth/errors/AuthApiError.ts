class AuthApiError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'AuthApiError'
    this.statusCode = statusCode
  }
}

export { AuthApiError }
