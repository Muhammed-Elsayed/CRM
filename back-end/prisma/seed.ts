import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, PipelineStageType } from '@prisma/client'
import { config as loadEnvFile } from 'dotenv'

const nodeEnv = process.env.NODE_ENV ?? 'development'

loadEnvFile({ path: `.env.${nodeEnv}` })
loadEnvFile()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required before seeding the database')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const defaultPipelineName = 'Default Sales Pipeline'
const defaultStages = [
  { name: 'New', order: 1, type: PipelineStageType.OPEN },
  { name: 'Follow Up', order: 2, type: PipelineStageType.OPEN },
  { name: 'Prospect', order: 3, type: PipelineStageType.OPEN },
  { name: 'Negotiation', order: 4, type: PipelineStageType.OPEN },
  { name: 'Won', order: 5, type: PipelineStageType.WON },
  { name: 'Lost', order: 6, type: PipelineStageType.LOST },
]

async function main() {
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
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
