import { PipelineStageType } from '@prisma/client'

import { disconnectDatabase, prisma } from '../db/config.js'

const defaultPipelineName = 'Default Sales Pipeline'
const defaultStages = [
  { name: 'New', order: 1, type: PipelineStageType.OPEN },
  { name: 'Follow Up', order: 2, type: PipelineStageType.OPEN },
  { name: 'Prospect', order: 3, type: PipelineStageType.OPEN },
  { name: 'Negotiation', order: 4, type: PipelineStageType.OPEN },
  { name: 'Won', order: 5, type: PipelineStageType.WON },
  { name: 'Lost', order: 6, type: PipelineStageType.LOST },
]

async function seedDefaultPipeline() {
  const pipeline = await prisma.pipeline.upsert({
    where: { name: defaultPipelineName },
    update: {},
    create: { name: defaultPipelineName },
  })

  for (const stage of defaultStages) {
    await prisma.pipelineStage.upsert({
      where: {
        pipelineId_name: {
          pipelineId: pipeline.id,
          name: stage.name,
        },
      },
      update: {
        order: stage.order,
        type: stage.type,
      },
      create: {
        pipelineId: pipeline.id,
        name: stage.name,
        order: stage.order,
        type: stage.type,
      },
    })
  }

  console.log('Default sales pipeline is ready')
}

seedDefaultPipeline()
  .catch((error: unknown) => {
    console.error('Failed to seed the default sales pipeline')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
