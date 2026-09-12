import { createMcpExpressApp } from '@modelcontextprotocol/express'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'

import { getServerConfig, type ServerConfig } from './config.js'
import { registerCompaniesTool } from './tools/company.tools.js'
import { registerContactsTool } from './tools/contact.tools.js'
import { registerLeadsTool } from './tools/lead.tools.js'
import { registerPipelinesTool } from './tools/pipeline.tools.js'

// The SDK handles MCP messages and exposes the tool we register below.
export function createServer() {
  const server = new McpServer({
    name: 'crm-companies',
    version: '1.0.0',
  })

  registerCompaniesTool(server)
  registerContactsTool(server)
  registerLeadsTool(server)
  registerPipelinesTool(server)

  return server
}

export function createApp(config: ServerConfig = getServerConfig()) {
  // The adapter connects the MCP handler to Node/Express requests and responses.
  const nodeHandler = toNodeHandler(createMcpHandler(createServer))

  // Use the same bind host as the listener, with optional deployment allowlists.
  const app = createMcpExpressApp({
    host: config.host,
    allowedHosts: config.allowedHosts,
    allowedOrigins: config.allowedOrigins,
  })

  app.all('/mcp', async (req, res) => {
    await nodeHandler(req, res, req.body)
  })

  return app
}
