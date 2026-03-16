import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_SERVER_URL = "http://localhost:4200/sse";

class McpClientService {
  private client: Client | null = null;
  private transport: SSEClientTransport | null = null;

  async connect() {
    if (this.client) return this.client;

    this.transport = new SSEClientTransport(new URL(MCP_SERVER_URL));
    this.client = new Client(
      {
        name: "url-shortener-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    return this.client;
  }

  async listTools() {
    const client = await this.connect();
    return await client.listTools();
  }

  async callTool(name: string, args: any) {
    const client = await this.connect();
    return await client.callTool({
      name,
      arguments: args,
    });
  }

  async disconnect() {
    if (this.transport) {
      await this.transport.close();
      this.client = null;
      this.transport = null;
    }
  }
}

export const mcpClientService = new McpClientService();
