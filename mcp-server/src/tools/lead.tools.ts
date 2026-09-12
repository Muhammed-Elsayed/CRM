import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { withToolErrorHandler } from '../middleware/error-handler.js'
import { allLeadsSchema, leadResultSchema } from '../schemas/lead.schema.js'
import { getAllLeads, getLead } from '../services/lead.service.js'
import { toToolResult } from '../utilities/tool-result.js'

export function registerLeadsTool(server: McpServer) {
  server.registerTool('get_all_leads', {
    description: 'Get all available CRM leads, fetching every page from the backend. No arguments required. Includes company, contact, owner, stage, priority, and source.',
    inputSchema: z.object({}),
    outputSchema: allLeadsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async () => toToolResult(await getAllLeads()), 'Could not retrieve leads.'))

  server.registerTool('get_lead', {
    description: 'Get one CRM lead by its UUID. Includes company, contact, owner, stage, priority, and source.',
    inputSchema: z.object({ id: z.uuid().describe('The lead ID returned by get_all_leads.') }),
    outputSchema: leadResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async ({ id }) => toToolResult(await getLead(id)), 'Could not retrieve lead.'))
}
