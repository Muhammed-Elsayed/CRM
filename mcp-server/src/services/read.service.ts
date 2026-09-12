import { z } from 'zod'
import { createCrmClient } from '../clients/crm.client.js'

export async function readData<T>(path: string, schema: z.ZodType<T>, operation: string) {
  const response = await createCrmClient().get(path, {}, AbortSignal.timeout(30_000), operation)
  const parsed = z.object({ data: schema }).safeParse(response)
  if (!parsed.success) throw new Error(`The backend returned an unexpected response while trying to ${operation}.`)
  return parsed.data.data
}

export async function readAllPages<T extends { id: string }>(
  path: string, itemSchema: z.ZodType<T>, plural: string, singular: string,
) {
  const client = createCrmClient()
  const signal = AbortSignal.timeout(30_000)
  const schema = z.object({ data: z.object({
    items: z.array(itemSchema),
    meta: z.object({
      page: z.number().int().positive(), total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  }) })
  const items: T[] = []
  let totalPages = 1
  let expectedTotal = 0
  for (let page = 1; page <= totalPages; page++) {
    const response = await client.get(path, { page: String(page), limit: '100' }, signal, `list ${plural}`)
    const parsed = schema.safeParse(response)
    if (!parsed.success || parsed.data.data.meta.page !== page) {
      throw new Error(`The backend returned an unexpected ${plural} response.`)
    }
    const { items: batch, meta } = parsed.data.data
    if (page === 1) {
      totalPages = meta.totalPages
      expectedTotal = meta.total
    } else if (meta.total !== expectedTotal || meta.totalPages !== totalPages) {
      throw new Error(`The ${singular} list changed during retrieval. Please call the tool again.`)
    }
    items.push(...batch)
  }
  if (items.length !== expectedTotal || new Set(items.map(item => item.id)).size !== expectedTotal) {
    throw new Error(`Could not retrieve a complete ${singular} list. Please call the tool again.`)
  }
  return { items, total: items.length }
}
