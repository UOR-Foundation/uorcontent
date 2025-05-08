import { NextRequest, NextResponse } from 'next/server';

interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  jsonrpc: string;
}

interface MCPResponse<T> {
  id: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  jsonrpc: string;
}

export async function POST(request: NextRequest) {
  try {
    const mcpRequest: MCPRequest = await request.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3001/api/mcp';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mcpRequest),
    });
    
    const data: MCPResponse<unknown> = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing MCP request:', error);
    
    return NextResponse.json(
      {
        id: 'error',
        error: {
          code: 500,
          message: 'Internal Server Error',
        },
        jsonrpc: '2.0',
      },
      { status: 500 }
    );
  }
}
