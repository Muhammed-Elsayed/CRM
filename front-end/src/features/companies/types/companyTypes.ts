import type {
  Company,
  CompanyListMeta,
} from '../schemas/companyApiSchemas'

type CompanyListParams = {
  page: number
  limit: number
  search?: string
}

type CompanyListResult = {
  items: Company[]
  meta: CompanyListMeta
}

type CreateCompanyInput = {
  name: string
  website?: string
  industry?: string
  size?: string
  country?: string
  city?: string
}

type UpdateCompanyInput = CreateCompanyInput

export type {
  Company,
  CompanyListMeta,
  CompanyListParams,
  CompanyListResult,
  CreateCompanyInput,
  UpdateCompanyInput,
}
