import { McpServer } from '@modelcontextprotocol/server';
import { toolsForCapabilities } from './tools.js';
import type { MediQuoteIdentity } from './mediquote-client.js';

export function buildServer(token: string, identity: MediQuoteIdentity): McpServer {
  const server = new McpServer({
    name: 'gasi-mediquote',
    version: '0.3.0',
  });

  for (const tool of toolsForCapabilities(identity.capabilities)) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (input) => {
        const startedAt = Date.now();
        try {
          const result = await tool.execute(token, input);
          console.info(JSON.stringify({
            event: 'tool_call',
            userId: identity.user.id,
            role: identity.user.role,
            connectionId: identity.connection.id,
            tool: tool.name,
            ok: true,
            ms: Date.now() - startedAt,
          }));
          return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          console.error(JSON.stringify({
            event: 'tool_call',
            userId: identity.user.id,
            role: identity.user.role,
            connectionId: identity.connection.id,
            tool: tool.name,
            ok: false,
            ms: Date.now() - startedAt,
            error: message,
          }));
          return { isError: true, content: [{ type: 'text' as const, text: message }] };
        }
      },
    );
  }
  return server;
}
