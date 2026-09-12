import { leadSchema } from '../schemas/lead.schema.js'
import { readAllPages, readData } from './read.service.js'

export async function getAllLeads() {
  const { items, total } = await readAllPages('/api/leads', leadSchema, 'leads', 'lead')
  return { leads: items, total }
}

export async function getLead(id: string) {
  const lead = await readData(`/api/leads/${encodeURIComponent(id)}`,
    leadSchema.refine(item => item.id === id), 'retrieve lead')
  return { lead }
}
