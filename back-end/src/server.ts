import { app } from './app.js'
import { config } from './config/index.js'
import { connectDatabase } from './db/config.js'

async function bootstrap() {
  await connectDatabase()

  app.listen(config.port, () => {
    console.log(`ClientFlow API listening on port ${config.port}`)
  })
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start ClientFlow API')
  console.error(error)
  process.exit(1)
})
