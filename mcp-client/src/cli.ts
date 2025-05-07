#!/usr/bin/env node
/**
 * UOR MCP Client CLI
 * 
 * Command-line interface for the UOR MCP client.
 */

import { Command } from 'commander';
import { UORMCPServer } from './index';

// Create a new Command instance
const program = new Command();

program.name('uor-mcp');
program.description('UOR MCP client');
program.version('0.1.0');

program
  .command('start')
  .description('Start the UOR MCP server')
  .option('-u, --url <url>', 'UOR API URL (default: https://uor.foundation/mcp)')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
  .action((options) => {
    const config = {
      baseUrl: options.url,
      apiKey: options.apiKey,
      timeout: parseInt(options.timeout)
    };

    const server = new UORMCPServer(config);
    server.run().catch((error) => {
      console.error('Error starting server:', error);
      process.exit(1);
    });
  });

program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
