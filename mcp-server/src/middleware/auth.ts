import { z } from 'zod'
import { getBackendBaseUrl } from '../config.js'

const credentialsSchema = z.object({
  BACKEND_EMAIL: z.email(),
  BACKEND_PASSWORD: z.string().min(1),
})
const tokenResponse = z.object({ data: z.object({ token: z.string().min(1) }) })

// Waiting callers keep their own deadlines without cancelling another tool's login.
function waitFor<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error('Backend authentication timed out. Please retry.'))
    signal.addEventListener('abort', abort, { once: true })
    operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

export class BackendAuthManager {
  private token: string | undefined
  private cookie: string | undefined
  private pending: Promise<string> | undefined

  constructor(
    private readonly baseUrl: string,
    private readonly credentials: { email: string; password: string },
  ) {}

  private async request(path: 'login' | 'refresh') {
    let response: Response
    try {
      response = await fetch(new URL(`/api/auth/${path}`, this.baseUrl), {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
        headers: {
          'Content-Type': 'application/json', 'X-CRM-Auth': '1',
          ...(this.cookie && path === 'refresh' ? { Cookie: this.cookie } : {}),
        },
        body: JSON.stringify(path === 'login' ? this.credentials : {}),
      })
    } catch {
      throw new Error('Could not reach backend authentication or the request timed out. Please retry.')
    }
    if (response.status === 401 && path === 'refresh') {
      this.cookie = undefined
      this.token = undefined
      return null
    }
    if (!response.ok) {
      throw new Error(response.status === 401
        ? 'Backend login failed. Check BACKEND_EMAIL and BACKEND_PASSWORD.'
        : `Backend authentication failed (HTTP ${response.status}). Please retry.`)
    }
    const parsed = tokenResponse.safeParse(await response.json().catch(() => null))
    const refreshCookie = response.headers.getSetCookie().find(value => value.startsWith('crm_refresh='))
    if (!parsed.success || !refreshCookie || !/^crm_refresh=[A-Za-z0-9_-]{43};/.test(refreshCookie)) {
      throw new Error('Backend returned an invalid authentication response.')
    }
    if (/;\s*Secure(?:;|$)/i.test(refreshCookie) && new URL(this.baseUrl).protocol !== 'https:') {
      throw new Error('Backend requires HTTPS cookies. Use HTTPS or explicitly enable backend insecure HTTP for this deployment.')
    }
    this.cookie = refreshCookie.split(';', 1)[0]
    this.token = parsed.data.data.token
    return this.token
  }

  private async login() {
    const token = await this.request('login')
    if (!token) throw new Error('Backend login failed.')
    return token
  }

  private singleFlight(operation: () => Promise<string>) {
    this.pending ??= operation().finally(() => { this.pending = undefined })
    return this.pending
  }

  getToken(signal: AbortSignal) {
    signal.throwIfAborted()
    return waitFor(this.pending ?? (this.token ? Promise.resolve(this.token) : this.singleFlight(() => this.login())), signal)
  }

  renew(rejectedToken: string, signal: AbortSignal) {
    signal.throwIfAborted()
    if (this.token && this.token !== rejectedToken) return Promise.resolve(this.token)
    return waitFor(this.singleFlight(async () => {
      const refreshed = this.cookie ? await this.request('refresh') : null
      return refreshed ?? this.login()
    }), signal)
  }
}

let manager: BackendAuthManager | undefined
let configuration: { baseUrl: string; email: string; password: string } | undefined

export function getBackendAuthManager() {
  const parsed = credentialsSchema.safeParse(process.env)
  if (!parsed.success) throw new Error('Set BACKEND_EMAIL and BACKEND_PASSWORD to valid backend login credentials.')
  const next = {
    baseUrl: getBackendBaseUrl(), email: parsed.data.BACKEND_EMAIL, password: parsed.data.BACKEND_PASSWORD,
  }
  if (!manager || configuration?.baseUrl !== next.baseUrl || configuration.email !== next.email || configuration.password !== next.password) {
    configuration = next
    manager = new BackendAuthManager(next.baseUrl, { email: next.email, password: next.password })
  }
  return manager
}
