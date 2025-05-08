
export interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  jsonrpc: string;
}

export interface MCPResponse<T> {
  id: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  jsonrpc: string;
}
