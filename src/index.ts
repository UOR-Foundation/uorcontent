/**
 * UOR Content Management Client
 * 
 * This is the main entry point for the UOR Content Management Client.
 * It initializes and starts the MCP server.
 */

import { MCPServer } from './server';

/**
 * Start the MCP server
 */
async function main(): Promise<void> {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const server = new MCPServer(port);
    
    await server.start();
    console.log(`MCP server started on port ${port}`);
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
