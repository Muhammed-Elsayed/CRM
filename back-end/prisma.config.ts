import { config as loadEnvFile } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

const nodeEnv = process.env.NODE_ENV ?? 'development'

loadEnvFile({ path: `.env.${nodeEnv}` })
loadEnvFile()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
