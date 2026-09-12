import { z } from 'zod'
import { pipelineSchema, pipelineStageSchema } from '../schemas/pipeline.schema.js'
import { readData } from './read.service.js'

export async function getPipelines() {
  // The backend includes stages by default and returns an unpaginated array.
  const pipelines = await readData('/api/pipelines', z.array(pipelineSchema), 'list pipelines')
  return { pipelines, total: pipelines.length }
}

export async function getPipelineStages(pipelineId: string) {
  const stages = await readData(`/api/pipelines/${encodeURIComponent(pipelineId)}/stages`,
    z.array(pipelineStageSchema.refine(stage => stage.pipelineId === pipelineId)), 'list pipeline stages')
  return { stages, total: stages.length }
}
