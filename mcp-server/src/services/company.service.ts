import { companySchema } from '../schemas/company.schema.js'
import { readAllPages, readData } from './read.service.js'

export async function getAllCompanies() {
  const { items, total } = await readAllPages('/api/companies', companySchema, 'companies', 'company')
  return { companies: items, total }
}

export async function getCompany(id: string) {
  const company = await readData(`/api/companies/${encodeURIComponent(id)}`,
    companySchema.refine(item => item.id === id), 'retrieve company')
  return { company }
}
