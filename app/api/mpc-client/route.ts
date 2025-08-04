import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { getCookie } from 'cookies-next';
import env from '@/env_file';
import { NextApiRequest, NextApiResponse } from 'next';
import { cookies } from "next/headers";

async function initializeMCPSession(token: string): Promise<MultiServerMCPClient> {
  const mcpUrl = `${env.PRODUCT_BACKEND_URL}product_api/mcp`; // Use Product service URL
  const protocolVersion = '2025-06-18';

  const client = new MultiServerMCPClient({
    mcpServers: {
      'product-service': {
        url: mcpUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json,text/event-stream',
          'MCP-Protocol-Version': protocolVersion,
          'Authorization': `Bearer ${token}`
        },
        transport: 'http',
        type:'http'
      }

    }
  });
  return client;
}

async function getMCPTools(client: MultiServerMCPClient): Promise<any> {
  try {
    const result = await client.getTools();
    return result;
  } catch (error) {}
}

// Example API route handler for Next.js
export async function GET(request: Request) {
  const accessToken =request.headers.get('Authorization')?.replace('Bearer ', '');
  

  if (!accessToken?.toString()) {
    return Response.json({ error: 'No access token provided' }, { status: 401 });
  }

  try {
    // Initialize MCP session
    const client = await initializeMCPSession(accessToken);

    // Fetch MCP tools
    const tools = await getMCPTools(client);
    console.log('tools ',tools);

    return Response.json(tools);
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return Response.json({ error: 'Failed to fetch MCP tools' }, { status: 500 });
  }
}