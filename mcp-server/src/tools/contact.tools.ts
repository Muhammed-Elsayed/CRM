import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { withToolErrorHandler } from '../middleware/error-handler.js'
import { allContactsSchema, contactResultSchema } from '../schemas/contact.schema.js'
import { getAllContacts, getContact } from '../services/contact.service.js'
import { toToolResult } from '../utilities/tool-result.js'

export function registerContactsTool(server: McpServer) {
  server.registerTool('get_all_contacts', {
    description: 'Get all available CRM contacts, fetching every page from the backend. No arguments required. Includes each contact’s company association.',
    inputSchema: z.object({}),
    outputSchema: allContactsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async () => toToolResult(await getAllContacts()), 'Could not retrieve contacts.'))

  server.registerTool('get_contact', {
    description: 'Get one CRM contact by its UUID. Includes each contact’s company association.',
    inputSchema: z.object({ id: z.uuid().describe('The contact ID returned by get_all_contacts.') }),
    outputSchema: contactResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async ({ id }) => toToolResult(await getContact(id)), 'Could not retrieve contact.'))
}
