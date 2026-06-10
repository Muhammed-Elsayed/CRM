import { config as loadEnvFile } from 'dotenv'

const nodeEnv = process.env.NODE_ENV ?? 'development'

loadEnvFile({ path: `.env.${nodeEnv}` })
loadEnvFile()

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
}

export { config }
