import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { withToolErrorHandler } from '../middleware/error-handler.js'
import { pipelinesResultSchema, stagesResultSchema } from '../schemas/pipeline.schema.js'
import { getPipelines, getPipelineStages } from '../services/pipeline.service.js'
import { toToolResult } from '../utilities/tool-result.js'

export function registerPipelinesTool(server: McpServer) {
  server.registerTool('get_pipelines', {
    description: 'List all available CRM sales pipelines, including their stages. No arguments required.',
    inputSchema: z.object({}), outputSchema: pipelinesResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async () => toToolResult(await getPipelines()), 'Could not retrieve pipelines.'))

  server.registerTool('get_pipeline_stages', {
    description: 'List the stages of a CRM pipeline in their configured order.',
    inputSchema: z.object({ pipelineId: z.uuid().describe('The pipeline ID returned by get_pipelines.') }),
    outputSchema: stagesResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, withToolErrorHandler(async ({ pipelineId }) => toToolResult(await getPipelineStages(pipelineId)), 'Could not retrieve pipeline stages.'))
}
