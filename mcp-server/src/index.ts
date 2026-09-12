import dotenv from 'dotenv'

import { getServerConfig } from './config.js'
import { createApp } from './server.js'

dotenv.config({ quiet: true })

try {
  const config = getServerConfig()
  createApp(config).listen(config.port, config.host, (error?: Error) => {
    if (error) {
      console.error('Failed to start CRM MCP server:', error.message)
      process.exitCode = 1
      return
    }

    const host = config.host.includes(':') ? `[${config.host}]` : config.host
    console.log(`CRM MCP server listening at http://${host}:${config.port}/mcp`)
  })
} catch (error) {
  console.error('Failed to start CRM MCP server:', error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
}
