import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { withToolErrorHandler } from '../middleware/error-handler.js'
import { allCompaniesSchema, companyResultSchema } from '../schemas/company.schema.js'
import { getAllCompanies, getCompany } from '../services/company.service.js'
import { toToolResult } from '../utilities/tool-result.js'

export function registerCompaniesTool(server: McpServer) {
  server.registerTool('get_all_companies', {
    description: 'Get all available CRM companies, fetching every page from the backend. No arguments required.',
    inputSchema: z.object({}),
    outputSchema: allCompaniesSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async () => toToolResult(await getAllCompanies()), 'Could not retrieve companies.'))

  server.registerTool('get_company', {
    description: 'Get one CRM company by its UUID.',
    inputSchema: z.object({ id: z.uuid().describe('The company ID returned by get_all_companies.') }),
    outputSchema: companyResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async ({ id }) => toToolResult(await getCompany(id)), 'Could not retrieve company.'))
}
