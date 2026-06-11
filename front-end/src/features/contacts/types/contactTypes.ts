import type {
  CompanyOption,
  Contact,
  ContactListMeta,
} from '../schemas/contactApiSchemas'

type ContactListParams = {
  page: number
  limit: number
  search?: string
}

type ContactListResult = {
  items: Contact[]
  meta: ContactListMeta
}

type CreateContactInput = {
  companyId?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  jobTitle?: string
}

type UpdateContactInput = CreateContactInput

export type {
  CompanyOption,
  Contact,
  ContactListMeta,
  ContactListParams,
  ContactListResult,
  CreateContactInput,
  UpdateContactInput,
}
