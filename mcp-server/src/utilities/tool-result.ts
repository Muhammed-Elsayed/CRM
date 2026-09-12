import type { CallToolResult } from '@modelcontextprotocol/server'

export function toToolResult(data: Record<string, unknown>): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data }
}
