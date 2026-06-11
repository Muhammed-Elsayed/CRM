const AUTH_TOKEN_STORAGE_KEY = 'clientflow.authToken'

function persistAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

function clearStoredAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export {
  AUTH_TOKEN_STORAGE_KEY,
  clearStoredAuthToken,
  getStoredAuthToken,
  persistAuthToken,
}
