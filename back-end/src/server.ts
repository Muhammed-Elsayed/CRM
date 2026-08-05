import { app } from './app.js'
import { config } from './config/index.js'
import { connectDatabase, disconnectDatabase } from './db/config.js'

async function bootstrap() {
  await connectDatabase()

  const server = app.listen(config.port, () => {
    console.log(`ClientFlow API listening on port ${config.port}`)
  })

  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`Received ${signal}, shutting down ClientFlow API`)

    server.close(async (error) => {
      if (error) {
        console.error(error)
      }

      await disconnectDatabase()
      process.exit(error ? 1 : 0)
    })

    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000).unref()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start ClientFlow API')
  console.error(error)
  process.exit(1)
})
