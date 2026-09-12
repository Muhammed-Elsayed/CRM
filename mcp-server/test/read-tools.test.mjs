import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { createServer } from '../dist/server.js'

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const dates = { createdAt: '2026-09-08T00:00:00.000Z', updatedAt: '2026-09-08T00:00:00.000Z' }
const company = { id: id(400), name: 'Test company', website: null, industry: null, size: null, country: null, city: null, ...dates }
const stage = { id: id(501), pipelineId: id(500), name: 'Qualified', order: 2, type: 'OPEN', ...dates }
const pipeline = { id: id(500), name: 'Sales', stages: [stage], ...dates }
const contact = n => ({
  id: id(n), companyId: company.id, firstName: 'Test', lastName: 'Contact', email: null,
  phone: null, jobTitle: null, company, ...dates,
})
const lead = n => ({
  id: id(n), title: 'Test lead', description: null, companyId: company.id, contactId: id(200),
  ownerId: id(300), stageId: stage.id, value: '9999999999.99', source: 'REFERRAL', priority: 'HIGH',
  expectedCloseDate: null, closedAt: null, company, contact: contact(200), stage,
  owner: { id: id(300), name: 'Owner', email: 'owner@example.com', createdAt: dates.createdAt }, ...dates,
})
const page = (items, number = 1, total = items.length, totalPages = total ? 1 : 0) => Response.json({
  data: { items, meta: { page: number, total, totalPages } },
})

function setup(t, respond) {
  const keys = ['BACKEND_EMAIL', 'BACKEND_PASSWORD', 'BACKEND_BASE_URL']
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  Object.assign(process.env, { BACKEND_EMAIL: `${randomUUID()}@example.com`, BACKEND_PASSWORD: 'test-password', BACKEND_BASE_URL: 'http://backend.test' })
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value
  })
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.pathname === '/api/auth/login') return Response.json({ data: { token: 'test-token' } }, {
      headers: { 'Set-Cookie': `crm_refresh=${'a'.repeat(43)}; HttpOnly; Path=/api/auth; SameSite=Lax` },
    })
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.ok(!options.method || options.method === 'GET')
    return respond(url, options)
  })
  const handler = createMcpHandler(createServer)
  return {
    fetchMock,
    async call(name, args = {}) {
      const response = await handler.fetch(new Request('http://localhost/mcp', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
      }))
      assert.equal(response.status, 200)
      const body = await response.text()
      const line = body.split('\n').find(line => line.startsWith('data: '))
      return JSON.parse(line ? line.slice(6) : body)
    },
  }
}

for (const [plural, fixture] of [['contacts', contact], ['leads', lead]]) {
  test(`get_all_${plural} retrieves every page and preserves associations`, async t => {
    const records = Array.from({ length: 101 }, (_, n) => fixture(n + 1))
    const { call, fetchMock } = setup(t, url => {
      assert.equal(url.pathname, `/api/${plural}`)
      assert.equal(url.searchParams.get('limit'), '100')
      const number = Number(url.searchParams.get('page'))
      return page(records.slice((number - 1) * 100, number * 100), number, 101, 2)
    })
    const { result, error } = await call(`get_all_${plural}`)
    assert.equal(error, undefined)
    assert.equal(result.isError, undefined)
    assert.deepEqual(result.structuredContent, { [plural]: records, total: 101 })
    assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent)
    assert.equal(fetchMock.mock.callCount(), 3)
  })

  test(`get_all_${plural} returns empty lists`, async t => {
    const { call } = setup(t, () => page([]))
    assert.deepEqual((await call(`get_all_${plural}`)).result.structuredContent, { [plural]: [], total: 0 })
  })

  test(`get_all_${plural} rejects partial, duplicate, changing and malformed responses`, async t => {
    const scenarios = [
      url => Number(url.searchParams.get('page')) === 1 ? page([fixture(1)], 1, 2, 2) : new Response(null, { status: 503 }),
      () => page([fixture(1), fixture(1)], 1, 2, 1),
      () => page([fixture(1)], 1, 2, 1),
      url => Number(url.searchParams.get('page')) === 1 ? page([fixture(1)], 1, 2, 2) : page([fixture(2)], 2, 3, 2),
      () => page([{ id: id(1) }]),
      () => page([fixture(1)], 9),
    ]
    for (const [index, respond] of scenarios.entries()) {
      await t.test(`scenario ${index + 1}`, async t => {
        const { call } = setup(t, respond)
        const { result } = await call(`get_all_${plural}`)
        assert.equal(result.isError, true)
        assert.equal(result.structuredContent, undefined)
      })
    }
  })
}

for (const [singular, plural, record] of [['company', 'companies', company], ['contact', 'contacts', contact(1)], ['lead', 'leads', lead(1)]]) {
  test(`get_${singular} retrieves the requested record`, async t => {
    const { call } = setup(t, url => {
      assert.equal(url.pathname, `/api/${plural}/${record.id}`)
      assert.equal(url.search, '')
      return Response.json({ data: record })
    })
    const { result } = await call(`get_${singular}`, { id: record.id })
    assert.deepEqual(result.structuredContent, { [singular]: record })
  })

  test(`get_${singular} validates IDs before contacting the backend`, async t => {
    const { call, fetchMock } = setup(t, () => { throw new Error('Unexpected fetch') })
    for (const args of [{}, { id: '../auth/login' }, { id: 123 }]) {
      const message = await call(`get_${singular}`, args)
      assert.ok(message.error || message.result?.isError)
    }
    assert.equal(fetchMock.mock.callCount(), 0)
  })

  test(`get_${singular} reports missing records and mismatched IDs as tool errors`, async t => {
    for (const respond of [() => new Response(null, { status: 404 }), () => Response.json({ data: { ...record, id: id(999) } })]) {
      await t.test('invalid detail response', async t => {
        const { call } = setup(t, respond)
        const { result } = await call(`get_${singular}`, { id: record.id })
        assert.equal(result.isError, true)
        assert.equal(result.structuredContent, undefined)
      })
    }
  })
}

test('nullable contact associations and lead relations are preserved; unselected owner fields are stripped', async t => {
  const record = { ...lead(1), company: null, companyId: null, contact: null, contactId: null,
    owner: { ...lead(1).owner, passwordHash: 'must-not-be-returned' } }
  const { call } = setup(t, url => Response.json({ data: url.pathname.includes('/contacts/')
    ? { ...contact(1), company: null, companyId: null } : record }))
  assert.equal((await call('get_contact', { id: id(1) })).result.structuredContent.contact.company, null)
  const { result } = await call('get_lead', { id: id(1) })
  assert.equal(result.structuredContent.lead.company, null)
  assert.equal(result.structuredContent.lead.value, '9999999999.99')
  assert.ok(!JSON.stringify(result).includes('passwordHash'))
})

test('pipeline tools preserve stages and configured order', async t => {
  const stages = [{ ...stage, id: id(502), order: 0, name: 'New' }, stage]
  const { call } = setup(t, url => {
    if (url.pathname === '/api/pipelines') return Response.json({ data: [{ ...pipeline, stages }] })
    assert.equal(url.pathname, `/api/pipelines/${pipeline.id}/stages`)
    return Response.json({ data: stages })
  })
  assert.deepEqual((await call('get_pipelines')).result.structuredContent, { pipelines: [{ ...pipeline, stages }], total: 1 })
  assert.deepEqual((await call('get_pipeline_stages', { pipelineId: pipeline.id })).result.structuredContent, { stages, total: 2 })
})

test('pipeline tools handle empty collections', async t => {
  const { call } = setup(t, () => Response.json({ data: [] }))
  assert.deepEqual((await call('get_pipelines')).result.structuredContent, { pipelines: [], total: 0 })
  assert.deepEqual((await call('get_pipeline_stages', { pipelineId: pipeline.id })).result.structuredContent, { stages: [], total: 0 })
})

test('pipeline tools reject malformed responses, foreign stages and missing pipelines', async t => {
  for (const [name, respond] of [
    ['get_pipelines', () => Response.json({ data: [{}] })],
    ['get_pipeline_stages', () => Response.json({ data: [{ ...stage, pipelineId: id(999) }] })],
    ['get_pipeline_stages', () => new Response(null, { status: 404 })],
  ]) {
    await t.test(name, async t => {
      const { call } = setup(t, respond)
      assert.equal((await call(name, { pipelineId: pipeline.id })).result.isError, true)
    })
  }
})

test('get_pipeline_stages requires a valid pipeline UUID before making requests', async t => {
  const { call, fetchMock } = setup(t, () => { throw new Error('Unexpected fetch') })
  for (const args of [{}, { pipelineId: 'invalid' }]) {
    const message = await call('get_pipeline_stages', args)
    assert.ok(message.error || message.result?.isError)
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})
