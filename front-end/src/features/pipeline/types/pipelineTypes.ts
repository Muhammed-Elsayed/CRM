import type {
  BoardStage,
  Company,
  Contact,
  Lead,
  LeadPriority,
  LeadSource,
  Pipeline,
  PipelineBoard,
} from '../schemas/pipelineApiSchemas'

type CreateLeadInput = {
  title: string
  description?: string
  companyId?: string
  contactId?: string
  stageId: string
  value: number
  source: LeadSource
  priority: LeadPriority
  expectedCloseDate?: string
}

type MoveLeadStageInput = {
  leadId: string
  stageId: string
}

type UpdateLeadInput = {
  title: string
  description?: string | null
  value: number
}

export type {
  BoardStage,
  Company,
  Contact,
  CreateLeadInput,
  Lead,
  LeadPriority,
  LeadSource,
  MoveLeadStageInput,
  Pipeline,
  PipelineBoard,
  UpdateLeadInput,
}
