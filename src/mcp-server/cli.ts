#!/usr/bin/env node
/**
 * UOR MCP Server CLI
 * 
 * Command-line interface for the UOR MCP server
 */

import { Command } from 'commander';
import { UORMCPServer } from './index';

const program = new Command();

program
  .name('uor-mcp-server')
  .description('UOR MCP Server - Model Context Protocol server for the Universal Object Reference framework')
  .version('0.1.0');

program
  .command('start')
  .description('Start the MCP server')
  .option('-p, --port <port>', 'Port for HTTP transport', '9000')
  .option('-t, --transport <transport>', 'Transport type (stdio or http)', 'stdio')
  .option('-a, --api-url <url>', 'Base URL for the UOR API', 'http://localhost:3000/api')
  .action(async (options) => {
    try {
      const server = new UORMCPServer({
        apiUrl: options.apiUrl,
        port: parseInt(options.port, 10),
        transport: options.transport as 'stdio' | 'http'
      });
      
      await server.start();
      
      console.log(`UOR MCP server started with ${options.transport} transport`);
      if (options.transport === 'http') {
        console.log(`Server listening on port ${options.port}`);
      }
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
