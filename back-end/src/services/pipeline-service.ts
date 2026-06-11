import { prisma } from '../db/config.js'
import type { BoardLeadModel } from '../models/lead-model.js'
import {
    pipelineSelect,
    pipelineStageBoardSelect,
    pipelineStageSelect,
    pipelineWithStagesSelect,
    type PipelineStageBoardModel,
} from '../models/pipeline-model.js'
import { publicUserSelect, type PublicUserModel } from '../models/user-model.js'
import type { BoardQuery, PipelineListQuery } from '../schemas/sales-pipeline-schema.js'
import { WebError } from '../utilities/web-errors.js'

type BoardLeadWithOwner = BoardLeadModel & {
    owner: PublicUserModel | null
}

type PipelineStageBoardWithOwners = Omit<PipelineStageBoardModel, 'leads'> & {
    leads: BoardLeadWithOwner[]
}

class PipelineService {
    private readonly defaultPipelineName = 'Default Sales Pipeline'

    async list(query: PipelineListQuery) {
        if (query.includeStages) {
            return prisma.pipeline.findMany({
                select: pipelineWithStagesSelect,
                orderBy: { createdAt: 'asc' },
            })
        }

        return prisma.pipeline.findMany({
            select: pipelineSelect,
            orderBy: { createdAt: 'asc' },
        })
    }

    async getDefault() {
        const pipeline = await prisma.pipeline.findUnique({
            where: { name: this.defaultPipelineName },
            select: pipelineWithStagesSelect,
        })

        if (!pipeline) {
            throw WebError.NotFound('Default sales pipeline was not found. Run the database seed first.')
        }

        return pipeline
    }

    async getStages(pipelineId: string) {
        await this.ensurePipelineExists(pipelineId)

        return prisma.pipelineStage.findMany({
            where: { pipelineId },
            select: pipelineStageSelect,
            orderBy: { order: 'asc' },
        })
    }

    async getBoard(query: BoardQuery) {
        const pipeline = query.pipelineId
            ? await prisma.pipeline.findUnique({
                  where: { id: query.pipelineId },
                  select: pipelineSelect,
              })
            : await prisma.pipeline.findUnique({
                  where: { name: this.defaultPipelineName },
                  select: pipelineSelect,
              })

        if (!pipeline) {
            throw WebError.NotFound('Pipeline was not found')
        }

        const stages = await prisma.pipelineStage.findMany({
            where: { pipelineId: pipeline.id },
            select: pipelineStageBoardSelect,
            orderBy: { order: 'asc' },
        })

        return {
            pipeline,
            stages: await this.attachOwnersToStages(stages),
        }
    }

    private async ensurePipelineExists(pipelineId: string) {
        const pipeline = await prisma.pipeline.findUnique({
            where: { id: pipelineId },
            select: { id: true },
        })

        if (!pipeline) {
            throw WebError.NotFound('Pipeline was not found')
        }
    }

    private async attachOwnersToStages(stages: PipelineStageBoardModel[]): Promise<PipelineStageBoardWithOwners[]> {
        const ownerIds = Array.from(new Set(stages.flatMap((stage) => stage.leads.map((lead) => lead.ownerId))))

        if (ownerIds.length === 0) {
            return stages.map((stage) => ({ ...stage, leads: [] }))
        }

        const owners = await prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: publicUserSelect,
        })
        const ownersById = new Map(owners.map((owner) => [owner.id, owner]))

        return stages.map((stage) => ({
            ...stage,
            leads: stage.leads.map((lead) => ({
                ...lead,
                owner: ownersById.get(lead.ownerId) ?? null,
            })),
        }))
    }
}

export { PipelineService }
