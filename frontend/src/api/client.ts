import { MCPRequest, MCPResponse } from '../types/shared';

export async function mcpClient<T>(request: MCPRequest): Promise<MCPResponse<T>> {
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  return response.json();
}
