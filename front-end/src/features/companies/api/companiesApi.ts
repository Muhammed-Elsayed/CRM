import { httpClient } from '@/shared/api/httpClient'
import { normalizeApiError } from '@/shared/api/normalizeApiError'

import {
  companiesResponseSchema,
  companyResponseSchema,
} from '../schemas/companyApiSchemas'
import type {
  Company,
  CompanyListParams,
  CompanyListResult,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../types/companyTypes'

const companiesErrorMessages = {
  invalidResponse: 'The server returned unexpected company data.',
  requestFailed: 'Unable to update companies right now.',
  networkError: 'Cannot reach the server. Please check that the backend is running.',
  unknownError: 'Something went wrong. Please try again.',
}

function withoutEmptyValues(input: CreateCompanyInput) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== ''),
  )
}

function nullableEmptyValues(input: UpdateCompanyInput) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )
}

async function listCompanies(
  params: CompanyListParams,
): Promise<CompanyListResult> {
  try {
    const response = await httpClient.get('/api/companies', { params })
    return companiesResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, companiesErrorMessages)
  }
}

async function createCompany(input: CreateCompanyInput): Promise<Company> {
  try {
    const response = await httpClient.post(
      '/api/companies',
      withoutEmptyValues(input),
    )
    return companyResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, companiesErrorMessages)
  }
}

async function getCompany(id: string): Promise<Company> {
  try {
    const response = await httpClient.get(`/api/companies/${id}`)
    return companyResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, companiesErrorMessages)
  }
}

async function updateCompany(
  id: string,
  input: UpdateCompanyInput,
): Promise<Company> {
  try {
    const response = await httpClient.patch(
      `/api/companies/${id}`,
      nullableEmptyValues(input),
    )
    return companyResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, companiesErrorMessages)
  }
}

async function deleteCompany(id: string): Promise<Company> {
  try {
    const response = await httpClient.delete(`/api/companies/${id}`)
    return companyResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, companiesErrorMessages)
  }
}

export {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
}
