import type { CallToolResult } from '@modelcontextprotocol/server'

export function withToolErrorHandler<Args extends unknown[]>(
  handler: (...args: Args) => CallToolResult | Promise<CallToolResult>,
  fallbackMessage = 'Could not execute tool.',
): (...args: Args) => Promise<CallToolResult> {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : fallbackMessage }],
      }
    }
  }
}
