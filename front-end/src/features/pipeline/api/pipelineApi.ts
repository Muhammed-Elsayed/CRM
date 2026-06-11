import { httpClient } from '@/shared/api/httpClient'
import { normalizeApiError } from '@/shared/api/normalizeApiError'

import {
  companiesResponseSchema,
  contactsResponseSchema,
  leadResponseSchema,
  pipelineBoardResponseSchema,
} from '../schemas/pipelineApiSchemas'
import type {
  Company,
  Contact,
  CreateLeadInput,
  Lead,
  MoveLeadStageInput,
  PipelineBoard,
  UpdateLeadInput,
} from '../types/pipelineTypes'

const pipelineErrorMessages = {
  invalidResponse: 'The server returned unexpected pipeline data.',
  requestFailed: 'Unable to update the pipeline right now.',
  networkError: 'Cannot reach the server. Please check that the backend is running.',
  unknownError: 'Something went wrong. Please try again.',
}

function withoutEmptyValues(input: CreateLeadInput) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== '' && value !== undefined),
  )
}

function normalizeLeadUpdateInput(input: UpdateLeadInput) {
  return {
    ...input,
    description: input.description === '' ? null : input.description,
  }
}

async function getPipelineBoard(): Promise<PipelineBoard> {
  try {
    const response = await httpClient.get('/api/pipelines/board')
    return pipelineBoardResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

async function listCompanies(): Promise<Company[]> {
  try {
    const response = await httpClient.get('/api/companies', {
      params: { limit: 100 },
    })
    return companiesResponseSchema.parse(response.data).data.items
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

async function listContacts(): Promise<Contact[]> {
  try {
    const response = await httpClient.get('/api/contacts', {
      params: { limit: 100 },
    })
    return contactsResponseSchema.parse(response.data).data.items
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

async function createLead(input: CreateLeadInput): Promise<Lead> {
  try {
    const response = await httpClient.post(
      '/api/leads',
      withoutEmptyValues(input),
    )
    return leadResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

async function moveLeadStage(input: MoveLeadStageInput): Promise<Lead> {
  try {
    const response = await httpClient.patch(`/api/leads/${input.leadId}/stage`, {
      stageId: input.stageId,
    })
    return leadResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
  try {
    const response = await httpClient.patch(
      `/api/leads/${id}`,
      normalizeLeadUpdateInput(input),
    )
    return leadResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

async function deleteLead(id: string): Promise<Lead> {
  try {
    const response = await httpClient.delete(`/api/leads/${id}`)
    return leadResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, pipelineErrorMessages)
  }
}

export {
  createLead,
  deleteLead,
  getPipelineBoard,
  listCompanies,
  listContacts,
  moveLeadStage,
  updateLead,
}
