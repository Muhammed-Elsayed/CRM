import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { config } from './config/index.js'
import { errorHandler, errorNotFoundHandler } from './middlewares/error-handler.js'
import { appRoutes } from './routes/index.js'

const app = express()

app.use(
  cors({
    credentials: true,
    origin: config.corsOrigin,
  }),
)
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    environment: config.nodeEnv,
  })
})

app.use('/api', appRoutes.router)
app.use(errorNotFoundHandler)
app.use(errorHandler)

export { app }
