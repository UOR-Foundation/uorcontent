import { MCPRequest, MCPResponse } from '../types/shared';

interface MockContent {
  id: string;
  name: string;
  description?: string;
}

const mockConcepts: MockContent[] = [
  { id: 'UOR-C-001', name: 'Entity', description: 'A thing with independent existence' },
  { id: 'UOR-C-002', name: 'Process', description: 'A series of actions to achieve a result' },
  { id: 'UOR-C-003', name: 'Attribute', description: 'A quality or feature of something' }
];

const mockPredicates: MockContent[] = [
  { id: 'UOR-P-001', name: 'hasAttribute', description: 'Relates an entity to its attribute' },
  { id: 'UOR-P-002', name: 'partOf', description: 'Indicates that something is part of another thing' },
  { id: 'UOR-P-003', name: 'relatesTo', description: 'Indicates a general relationship between things' }
];

const mockResources: MockContent[] = [
  { id: 'UOR-R-001', name: 'Introduction to UOR', description: 'An overview of the UOR Framework' },
  { id: 'UOR-R-002', name: 'UOR Concepts Guide', description: 'A guide to UOR concepts and their usage' },
  { id: 'UOR-R-003', name: 'UOR Implementation', description: 'Implementation details of the UOR Framework' }
];

const mockTopics: MockContent[] = [
  { id: 'UOR-T-001', name: 'Knowledge Representation', description: 'Methods for representing knowledge' },
  { id: 'UOR-T-002', name: 'Ontology Design', description: 'Principles of ontology design' },
  { id: 'UOR-T-003', name: 'Semantic Web', description: 'Technologies for the semantic web' }
];

/**
 * Mock MCP server handler
 * @param request MCP request
 * @returns MCP response
 */
export function mockMCPServer<T>(request: MCPRequest): Promise<MCPResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { method, params } = request;
      
      switch (method) {
        case 'listConcepts':
          resolve({
            id: request.id,
            result: mockConcepts as unknown as T,
            jsonrpc: '2.0'
          });
          break;
          
        case 'listPredicates':
          resolve({
            id: request.id,
            result: mockPredicates as unknown as T,
            jsonrpc: '2.0'
          });
          break;
          
        case 'listResources':
          resolve({
            id: request.id,
            result: mockResources as unknown as T,
            jsonrpc: '2.0'
          });
          break;
          
        case 'listTopics':
          resolve({
            id: request.id,
            result: mockTopics as unknown as T,
            jsonrpc: '2.0'
          });
          break;
          
        case 'getConceptById':
          const conceptId = params.id as string;
          const concept = mockConcepts.find(c => c.id === conceptId);
          
          if (concept) {
            resolve({
              id: request.id,
              result: concept as unknown as T,
              jsonrpc: '2.0'
            });
          } else {
            resolve({
              id: request.id,
              error: {
                code: 404,
                message: 'Concept not found',
              },
              jsonrpc: '2.0'
            });
          }
          break;
          
        default:
          resolve({
            id: request.id,
            error: {
              code: 400,
              message: `Method not supported: ${method}`,
            },
            jsonrpc: '2.0'
          });
      }
    }, 100); // 100ms delay
  });
}
