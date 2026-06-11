import type { Pipeline, PipelineStage, Prisma } from '@prisma/client'

import { leadBoardSelect } from './lead-model.js'

const pipelineStageSelect = {
    id: true,
    pipelineId: true,
    name: true,
    order: true,
    type: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.PipelineStageSelect

const pipelineSelect = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.PipelineSelect

const pipelineWithStagesSelect = {
    ...pipelineSelect,
    stages: {
        select: pipelineStageSelect,
        orderBy: {
            order: 'asc',
        },
    },
} satisfies Prisma.PipelineSelect

const pipelineStageBoardSelect = {
    ...pipelineStageSelect,
    leads: {
        select: leadBoardSelect,
        orderBy: [
            {
                updatedAt: 'desc',
            },
            {
                createdAt: 'desc',
            },
        ],
    },
} satisfies Prisma.PipelineStageSelect

type PipelineModel = Pipeline
type PipelineStageModel = PipelineStage
type PublicPipelineModel = Prisma.PipelineGetPayload<{ select: typeof pipelineSelect }>
type PipelineWithStagesModel = Prisma.PipelineGetPayload<{ select: typeof pipelineWithStagesSelect }>
type PipelineStageBoardModel = Prisma.PipelineStageGetPayload<{ select: typeof pipelineStageBoardSelect }>

export { pipelineSelect, pipelineStageBoardSelect, pipelineStageSelect, pipelineWithStagesSelect }
export type {
    PipelineModel,
    PipelineStageBoardModel,
    PipelineStageModel,
    PipelineWithStagesModel,
    PublicPipelineModel,
}
