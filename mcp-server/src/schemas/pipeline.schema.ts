import { z } from 'zod'

export const pipelineStageSchema = z.object({
  id: z.string(), pipelineId: z.string(), name: z.string(), order: z.number().int(),
  type: z.enum(['OPEN', 'WON', 'LOST']), createdAt: z.string(), updatedAt: z.string(),
})
export const pipelineSchema = z.object({
  id: z.string(), name: z.string(), createdAt: z.string(), updatedAt: z.string(),
  stages: z.array(pipelineStageSchema),
})
export const pipelinesResultSchema = z.object({ pipelines: z.array(pipelineSchema), total: z.number().int().nonnegative() })
export const stagesResultSchema = z.object({ stages: z.array(pipelineStageSchema), total: z.number().int().nonnegative() })
