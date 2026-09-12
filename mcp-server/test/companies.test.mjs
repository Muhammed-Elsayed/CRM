import assert from 'node:assert/strict'
import test from 'node:test'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { createServer } from '../dist/server.js'

function setup(t, respond) {
  const previousEmail = process.env.BACKEND_EMAIL
  const previousPassword = process.env.BACKEND_PASSWORD
  const previousUrl = process.env.BACKEND_BASE_URL
  process.env.BACKEND_EMAIL = `test-${crypto.randomUUID()}@example.com`
  process.env.BACKEND_PASSWORD = 'test-password'
  process.env.BACKEND_BASE_URL = 'http://backend.test'
  t.after(() => {
    for (const [key, value] of Object.entries({ BACKEND_EMAIL: previousEmail, BACKEND_PASSWORD: previousPassword, BACKEND_BASE_URL: previousUrl })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.pathname === '/api/auth/login') return Response.json({ data: { token: 'test-token' } }, {
      headers: { 'Set-Cookie': `crm_refresh=${'a'.repeat(43)}; HttpOnly; Path=/api/auth; SameSite=Lax` },
    })
    return respond(url, options)
  })
  const handler = createMcpHandler(createServer)

  return {
    fetchMock,
    async rpc(method = 'tools/call') {
      const response = await handler.fetch(new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-11-25',
        },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method,
          params: method === 'tools/call' ? { name: 'get_all_companies', arguments: {} } : {},
        }),
      }))
      const body = await response.text()
      assert.equal(response.status, 200, body)
      const line = body.split('\n').find(value => value.startsWith('data: '))
      const message = JSON.parse(line ? line.slice(6) : body)
      assert.equal(message.error, undefined, body)
      return message.result
    },
  }
}

function company(id) {
  return {
    id: String(id), name: `Company ${id}`, website: null, industry: null,
    size: null, country: null, city: null,
    createdAt: '2026-09-07T00:00:00.000Z', updatedAt: '2026-09-07T00:00:00.000Z',
  }
}

function pageResponse(items, page, total, totalPages) {
  return Response.json({ data: { items, meta: { page, total, totalPages } } })
}

test('discovers all eight read-only tools without backend credentials', async t => {
  const { rpc, fetchMock } = setup(t, () => { throw new Error('Unexpected fetch') })
  delete process.env.BACKEND_EMAIL
  const result = await rpc('tools/list')
  assert.deepEqual(result.tools.map(tool => tool.name).sort(), [
    'get_all_companies', 'get_all_contacts', 'get_all_leads', 'get_company',
    'get_contact', 'get_lead', 'get_pipeline_stages', 'get_pipelines',
  ].sort())
  for (const tool of result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true)
    assert.equal(tool.annotations.destructiveHint, false)
    assert.ok(tool.outputSchema)
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('fetches all 101 companies across pages and authenticates every request', async t => {
  const companies = Array.from({ length: 101 }, (_, i) => company(i))
  const { rpc, fetchMock } = setup(t, async (url, options) => {
    assert.equal(url.origin, 'http://backend.test')
    assert.equal(url.pathname, '/api/companies')
    assert.equal(url.searchParams.get('limit'), '100')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    const page = Number(url.searchParams.get('page'))
    return pageResponse(companies.slice((page - 1) * 100, page * 100), page, 101, 2)
  })
  const result = await rpc()
  assert.equal(result.isError, undefined)
  assert.deepEqual(result.structuredContent, { companies, total: 101 })
  assert.equal(fetchMock.mock.callCount(), 3)
})

test('returns an empty list when the backend has no companies', async t => {
  const { rpc } = setup(t, async () => pageResponse([], 1, 0, 0))
  assert.deepEqual((await rpc()).structuredContent, { companies: [], total: 0 })
})

test('missing credentials produce a tool error without making a request', async t => {
  const { rpc, fetchMock } = setup(t, () => { throw new Error('Unexpected fetch') })
  delete process.env.BACKEND_EMAIL
  const result = await rpc()
  assert.equal(result.isError, true)
  assert.match(result.content[0].text, /Set BACKEND_EMAIL/)
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('unclassified authentication failure does not retry', async t => {
  const { rpc } = setup(t, async () => new Response(null, { status: 401 }))
  const result = await rpc()
  assert.equal(result.isError, true)
  assert.match(result.content[0].text, /authentication or authorization failed/)
  assert.ok(!result.content[0].text.includes('test-token'))
})

test('a failure on a later page does not return partial success', async t => {
  const { rpc } = setup(t, async url => url.searchParams.get('page') === '1'
    ? pageResponse([company(1)], 1, 2, 2)
    : new Response(null, { status: 503 }))
  const result = await rpc()
  assert.equal(result.isError, true)
  assert.equal(result.structuredContent, undefined)
  assert.match(result.content[0].text, /HTTP 503/)
})

test('rejects malformed backend responses', async t => {
  const { rpc } = setup(t, async () => Response.json({ data: { items: [] } }))
  const result = await rpc()
  assert.equal(result.isError, true)
  assert.match(result.content[0].text, /unexpected companies response/)
})
