import axios from 'axios'

import {
  clearStoredAuthToken,
  getStoredAuthToken,
} from '@/shared/auth/authTokenStorage'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

httpClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredAuthToken()
    }

    return Promise.reject(error)
  },
)

export { httpClient }
