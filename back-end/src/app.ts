import cookieParser from 'cookie-parser'
import cors, { type CorsOptions } from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { config } from './config/index.js'
import { checkDatabaseConnection } from './db/config.js'
import { errorHandler, errorNotFoundHandler } from './middlewares/error-handler.js'
import { appRoutes } from './routes/index.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', config.trustProxy)

const corsOrigin: CorsOptions['origin'] = (origin, callback) => {
  if (!origin || config.corsOrigins.includes(origin)) {
    callback(null, true)
    return
  }

  callback(null, false)
}

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
})

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(helmet())
app.use(
  cors({
    credentials: true,
    origin: corsOrigin,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/api', apiRateLimiter)
app.use('/api/auth/login', loginRateLimiter)

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
  })
})

app.get('/api/ready', async (_request, response) => {
  try {
    await checkDatabaseConnection()
    response.json({ ok: true })
  } catch {
    response.status(503).json({ ok: false })
  }
})

app.use('/api', appRoutes.router)
app.use(errorNotFoundHandler)
app.use(errorHandler)

export { app }
