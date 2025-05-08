import { MCPRequest, MCPResponse } from '../types/shared';

export async function mcpClient<T>(request: MCPRequest): Promise<MCPResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && !request.method.includes('login') && !request.method.includes('register')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
