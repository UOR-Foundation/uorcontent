# UOR MCP Client

[![npm version](https://img.shields.io/npm/v/@uor-foundation/mcp-client.svg)](https://www.npmjs.com/package/@uor-foundation/mcp-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) client for the Universal Object Reference (UOR) framework. This package allows AI assistants to access UOR content through the MCP protocol.

## Installation

```bash
npm install -g @uor-foundation/mcp-client
```

## Usage

### As a CLI Tool

```bash
# Start the MCP server with default settings
uor-mcp start

# Start with custom API URL
uor-mcp start --url https://custom-uor-api.example.com

# Start with API key
uor-mcp start --api-key YOUR_API_KEY

# Show help
uor-mcp --help
```

### In Claude Desktop App

1. Open Claude Desktop App settings
2. Navigate to the MCP section
3. Add a new MCP server with the following configuration:
   ```json
   {
     "mcpServers": {
       "uor-foundation": {
         "command": "npx",
         "args": ["-y", "@uor-foundation/mcp-client"],
         "disabled": false
       }
     }
   }
   ```

### In Claude Web Interface

1. Open Claude settings
2. Navigate to the MCP section
3. Add a new MCP server with the following configuration:
   ```json
   {
     "mcpServers": {
       "uor-foundation": {
         "command": "npx",
         "args": ["-y", "@uor-foundation/mcp-client"],
         "disabled": false
       }
     }
   }
   ```

## Available Tools

The UOR MCP client provides the following tools:

- `get_concept_by_id`: Get a concept by ID
- `get_predicate_by_id`: Get a predicate by ID
- `get_topic_by_id`: Get a topic by ID
- `search_concepts`: Search for concepts

## Available Resources

The UOR MCP client provides access to the following resource templates:

- `uor://concept/{id}`: Access UOR concepts
- `uor://predicate/{id}`: Access UOR predicates
- `uor://topic/{id}`: Access UOR topics
- `uor://resource/{id}`: Access UOR resources

## Development

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Setup

```bash
# Clone the repository
git clone https://github.com/uor-foundation/uor-content.git
cd uor-content/mcp-client

# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Publishing

The package is automatically published to npm when a new release is created on GitHub. You can also manually trigger the publish workflow from the GitHub Actions tab.

## License

MIT
