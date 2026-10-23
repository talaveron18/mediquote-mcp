import { McpServer } from '@modelcontextprotocol/server';
import { tools } from './tools.js';

export function buildServer(): McpServer {
  const server = new McpServer({
    name: 'gasi-mediquote',
    version: '0.2.0',
  });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (input) => {
        const startedAt = Date.now();
        try {
          const result = await tool.execute(input);
          console.info(JSON.stringify({ event: 'tool_call', tool: tool.name, ok: true, ms: Date.now() - startedAt }));
          return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          console.error(JSON.stringify({ event: 'tool_call', tool: tool.name, ok: false, ms: Date.now() - startedAt, error: message }));
          return { isError: true, content: [{ type: 'text' as const, text: message }] };
        }
      },
    );
  }
  return server;
}
