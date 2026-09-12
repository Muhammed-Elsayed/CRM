import assert from 'node:assert/strict'
import test from 'node:test'

import { getBackendBaseUrl, getServerConfig } from '../dist/config.js'

test('uses local listener defaults when no overrides are supplied', () => {
  assert.deepEqual(getServerConfig({}), {
    host: '127.0.0.1', port: 4001, allowedHosts: undefined, allowedOrigins: undefined,
  })
})

test('accepts deployment listener and hostname settings', () => {
  assert.deepEqual(getServerConfig({
    HOST: '0.0.0.0', PORT: '8080',
    MCP_ALLOWED_HOSTS: 'mcp.example.com, internal.example.com',
    MCP_ALLOWED_ORIGINS: 'app.example.com',
  }), {
    host: '0.0.0.0', port: 8080,
    allowedHosts: ['mcp.example.com', 'internal.example.com'],
    allowedOrigins: ['app.example.com'],
  })
})

test('blank optional hostname settings preserve SDK defaults', () => {
  const config = getServerConfig({ MCP_ALLOWED_HOSTS: ' ', MCP_ALLOWED_ORIGINS: '' })
  assert.equal(config.allowedHosts, undefined)
  assert.equal(config.allowedOrigins, undefined)
})

test('rejects invalid listener settings with the variable name', () => {
  for (const PORT of ['', 'abc', '0', '-1', '65536', '4001.5']) {
    assert.throws(() => getServerConfig({ PORT }), /check PORT/)
  }
  assert.throws(() => getServerConfig({ HOST: ' ' }), /check HOST/)
})

test('requires an explicit HTTP backend address', () => {
  assert.equal(getBackendBaseUrl({ BACKEND_BASE_URL: 'https://crm.example.com' }), 'https://crm.example.com')
  for (const BACKEND_BASE_URL of [undefined, '', 'invalid', 'ftp://crm.example.com']) {
    assert.throws(() => getBackendBaseUrl({ BACKEND_BASE_URL }), /BACKEND_BASE_URL/)
  }
})
