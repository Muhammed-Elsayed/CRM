import { config as loadEnvFile } from 'dotenv'
import { z } from 'zod'

const nodeEnv = process.env.NODE_ENV ?? 'development'

loadEnvFile({ path: `.env.${nodeEnv}` })
loadEnvFile()

const trustProxyFromEnv = z.preprocess((value) => {
  if (value === undefined || value === '') {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  const normalizedValue = value.trim().toLowerCase()

  if (['true', 'yes', 'on'].includes(normalizedValue)) {
    return 1
  }

  if (['false', 'no', 'off'].includes(normalizedValue)) {
    return false
  }

  const numericValue = Number(normalizedValue)

  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : value
}, z.union([z.boolean(), z.number().int().min(0)]))

const corsOriginValue = z.union([
  z.literal('*'),
  z.string().url().transform((origin) => new URL(origin).origin),
])

const commaSeparatedOrigins = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}, z.array(corsOriginValue).min(1))

const origin = corsOriginValue

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    CORS_ORIGINS: commaSeparatedOrigins.optional(),
    CORS_ORIGIN: origin.optional(),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    TRUST_PROXY: trustProxyFromEnv.optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  })
  .superRefine((env, context) => {
    if (!env.CORS_ORIGINS && !env.CORS_ORIGIN) {
      context.addIssue({
        code: 'custom',
        message: 'CORS_ORIGINS is required',
        path: ['CORS_ORIGINS'],
      })
    }

    if (env.NODE_ENV === 'production' && /replace|change|development/i.test(env.JWT_SECRET)) {
      context.addIssue({
        code: 'custom',
        message: 'JWT_SECRET must be a production secret, not a placeholder',
        path: ['JWT_SECRET'],
      })
    }
  })

const parsedEnv = envSchema.parse(process.env)
const corsOrigins = Array.from(new Set(parsedEnv.CORS_ORIGINS ?? [parsedEnv.CORS_ORIGIN as string]))
const allowAllCorsOrigins = corsOrigins.includes('*')

const config = {
  nodeEnv: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  port: parsedEnv.PORT,
  corsOrigins,
  allowAllCorsOrigins,
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  trustProxy: parsedEnv.TRUST_PROXY ?? (parsedEnv.NODE_ENV === 'production' ? 1 : false),
  logLevel: parsedEnv.LOG_LEVEL,
}

export { config }
