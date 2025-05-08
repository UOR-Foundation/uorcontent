# MCP Server Implementation

This PR implements an MCP (Model Context Protocol) server for the UOR-Foundation/uorcontent repository using the specified MCP SDK. The implementation allows AI assistants to access UOR content through the MCP protocol.

## Features

- Full implementation of the MCP protocol for UOR content
- Support for both stdio and HTTP transports
- Access to UOR concepts, predicates, topics, and resources
- Tool support for getting concepts, predicates, topics, and searching
- Comprehensive validation of requests and responses
- Thorough test coverage

## Implementation Details

The implementation follows the MCP specification and integrates with the existing UOR content repository. It provides a standardized way for AI assistants to access UOR content through the MCP protocol.

### Components

1. **MCP Server** - Main entry point for the MCP server
2. **UOR Service** - Service for interacting with the UOR API
3. **Resource Manager** - Manager for UOR resources in the MCP server
4. **Tools Manager** - Manager for UOR tools in the MCP server
5. **Validation Service** - Service for validating MCP requests and responses
6. **CLI Script** - Command-line interface for the MCP server

## Testing

The implementation includes comprehensive unit and integration tests to ensure correct functionality. All tests pass and the code meets the linting requirements.

## Stone Tool Attribution

This implementation was created using the Stone tool's role-based development approach:

1. **PM Role**: Generated the implementation plan with detailed specifications
2. **QA Role**: Created comprehensive test specifications for all components
3. **Feature Role**: Implemented the code based on the specifications
4. **Auditor Role**: Validated the implementation for security and best practices
5. **Actions Role**: Set up CI/CD for the MCP server

## Implementation Improvements

1. **Dual Transport Support**: The server supports both stdio and HTTP transports, allowing flexibility in how it's accessed
2. **Comprehensive Validation**: All requests and responses are validated against the MCP schema
3. **Error Handling**: Robust error handling with detailed error messages
4. **Modular Architecture**: Clear separation of concerns between components
5. **Extensibility**: Easy to extend with new resources and tools

## Link to Devin run

https://app.devin.ai/sessions/edffb33cd24f47aca7a5560742080e2f

## Requested by

Ilya Paveliev (paveliei@tcd.ie)
