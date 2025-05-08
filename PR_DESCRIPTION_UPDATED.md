# MCP Server Implementation

This PR implements an MCP (Model Context Protocol) server for the UOR-Foundation/uorcontent repository using the specified MCP SDK. The implementation allows AI assistants to access UOR content through the MCP protocol.

## Features

- Full implementation of the MCP protocol for UOR content
- Support for both stdio and HTTP transports
- Access to UOR concepts, predicates, topics, and resources
- Tool support for getting concepts, predicates, topics, and searching
- Comprehensive validation of requests and responses
- Thorough test coverage with strict linting enforcement

## Implementation Details

The implementation follows the MCP specification and integrates with the existing UOR content repository. It provides a standardized way for AI assistants to access UOR content through the MCP protocol.

Key components:
- JSON-RPC 2.0 compliant handler for MCP server
- Middleware for processing JSON-RPC requests
- Validation service for schema validation
- Resource and tools managers for UOR content access
- Comprehensive unit and integration tests

## Stone Tool Attribution

This implementation was created using the Stone tool for generating a comprehensive integration and validation plan. The Stone tool was used to:

1. Generate the initial implementation plan with the PM role
2. Create comprehensive test specifications with the QA role
3. Implement the code with the Feature role
4. Validate the implementation with the Auditor role
5. Set up CI/CD with the Actions role

## Link to Devin run

https://app.devin.ai/sessions/edffb33cd24f47aca7a5560742080e2f

## Requested by

Ilya Paveliev (paveliei@tcd.ie)
