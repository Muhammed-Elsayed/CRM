import { z } from 'zod'

const hostnameList = z.string().optional().transform(value => {
  const hostnames = value?.split(',').map(hostname => hostname.trim()).filter(Boolean)
  return hostnames?.length ? hostnames : undefined
})

const serverConfigSchema = z.object({
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  MCP_ALLOWED_HOSTS: hostnameList,
  MCP_ALLOWED_ORIGINS: hostnameList,
})

// Read configuration after dotenv has loaded, or directly from deployment variables.
export function getServerConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = serverConfigSchema.safeParse(env)
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(issue => issue.path.join('.')))]
    throw new Error(`Invalid server configuration: check ${fields.join(', ')}.`)
  }

  return {
    host: parsed.data.HOST,
    port: parsed.data.PORT,
    allowedHosts: parsed.data.MCP_ALLOWED_HOSTS,
    allowedOrigins: parsed.data.MCP_ALLOWED_ORIGINS,
  }
}

export type ServerConfig = ReturnType<typeof getServerConfig>

export function getBackendBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const baseUrl = env.BACKEND_BASE_URL?.trim()
  if (!baseUrl || !z.url({ protocol: /^https?$/ }).safeParse(baseUrl).success) {
    throw new Error('BACKEND_BASE_URL must be set to a valid HTTP or HTTPS URL.')
  }

  return baseUrl
}
