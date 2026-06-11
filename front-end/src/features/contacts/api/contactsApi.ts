import { httpClient } from '@/shared/api/httpClient'
import { normalizeApiError } from '@/shared/api/normalizeApiError'

import {
  companyOptionsResponseSchema,
  contactResponseSchema,
  contactsResponseSchema,
} from '../schemas/contactApiSchemas'
import type {
  CompanyOption,
  Contact,
  ContactListParams,
  ContactListResult,
  CreateContactInput,
  UpdateContactInput,
} from '../types/contactTypes'

const contactsErrorMessages = {
  invalidResponse: 'The server returned unexpected contact data.',
  requestFailed: 'Unable to update contacts right now.',
  networkError: 'Cannot reach the server. Please check that the backend is running.',
  unknownError: 'Something went wrong. Please try again.',
}

function withoutEmptyValues(input: CreateContactInput) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== ''),
  )
}

function nullableEmptyValues(input: UpdateContactInput) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )
}

async function listContacts(
  params: ContactListParams,
): Promise<ContactListResult> {
  try {
    const response = await httpClient.get('/api/contacts', { params })
    return contactsResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, contactsErrorMessages)
  }
}

async function listCompanyOptions(): Promise<CompanyOption[]> {
  try {
    const response = await httpClient.get('/api/companies', {
      params: { page: 1, limit: 100 },
    })
    return companyOptionsResponseSchema.parse(response.data).data.items
  } catch (error) {
    throw normalizeApiError(error, contactsErrorMessages)
  }
}

async function createContact(input: CreateContactInput): Promise<Contact> {
  try {
    const response = await httpClient.post(
      '/api/contacts',
      withoutEmptyValues(input),
    )
    return contactResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, contactsErrorMessages)
  }
}

async function getContact(id: string): Promise<Contact> {
  try {
    const response = await httpClient.get(`/api/contacts/${id}`)
    return contactResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, contactsErrorMessages)
  }
}

async function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<Contact> {
  try {
    const response = await httpClient.patch(
      `/api/contacts/${id}`,
      nullableEmptyValues(input),
    )
    return contactResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, contactsErrorMessages)
  }
}

async function deleteContact(id: string): Promise<Contact> {
  try {
    const response = await httpClient.delete(`/api/contacts/${id}`)
    return contactResponseSchema.parse(response.data).data
  } catch (error) {
    throw normalizeApiError(error, contactsErrorMessages)
  }
}

export {
  createContact,
  deleteContact,
  getContact,
  listCompanyOptions,
  listContacts,
  updateContact,
}
