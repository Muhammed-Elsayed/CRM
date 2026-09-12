import { contactSchema } from '../schemas/contact.schema.js'
import { readAllPages, readData } from './read.service.js'

export async function getAllContacts() {
  const { items, total } = await readAllPages('/api/contacts', contactSchema, 'contacts', 'contact')
  return { contacts: items, total }
}

export async function getContact(id: string) {
  const contact = await readData(`/api/contacts/${encodeURIComponent(id)}`,
    contactSchema.refine(item => item.id === id), 'retrieve contact')
  return { contact }
}
