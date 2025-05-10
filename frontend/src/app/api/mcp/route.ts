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

/**
 * API route handler for OPTIONS requests (CORS)
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const mcpRequest: MCPRequest = await request.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3001/api/mcp';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(backendUrl as string, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest),
    });
    
    if (response.status === 401) {
      return NextResponse.json(
        {
          id: mcpRequest.id,
          error: {
            code: 401,
            message: 'Authentication failed',
          },
          jsonrpc: '2.0',
        },
        { status: 401 }
      );
    }
    
    const data: MCPResponse<unknown> = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    
    return NextResponse.json(
      {
        id: 'error',
        error: {
          code: 500,
          message: 'Internal Server Error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        jsonrpc: '2.0',
      },
      { status: 500 }
    );
  }
}
