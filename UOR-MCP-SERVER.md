# UOR-MCP Server Documentation

## Overview

The UOR-MCP (Universal Object Reference - Management Content Protocol) server provides a standardized API for managing UOR Framework content. It implements a multi-layer validation pipeline with Schema.org integration to ensure content consistency and interoperability.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/UOR-Foundation/uorcontent.git
   cd uorcontent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

   For development with hot reloading:
   ```bash
   npm run dev
   ```

## Configuration

The server can be configured using environment variables:

- `PORT`: The port to listen on (default: 3000)
- `CORS_ORIGIN`: CORS origin configuration (default: '*')

## API Endpoints

The UOR-MCP server provides the following API endpoints:

### Content Management

- `GET /api/content`: Get all content items
- `GET /api/content/:id`: Get content by ID
- `POST /api/content`: Create new content
- `PUT /api/content/:id`: Update content by ID
- `DELETE /api/content/:id`: Delete content by ID

### Concept Management

- `GET /api/concepts`: Get all concepts
- `GET /api/concepts/:id`: Get concept by ID
- `POST /api/concepts`: Create new concept
- `PUT /api/concepts/:id`: Update concept by ID
- `DELETE /api/concepts/:id`: Delete concept by ID

### Predicate Management

- `GET /api/predicates`: Get all predicates
- `GET /api/predicates/:id`: Get predicate by ID
- `POST /api/predicates`: Create new predicate
- `PUT /api/predicates/:id`: Update predicate by ID
- `DELETE /api/predicates/:id`: Delete predicate by ID

### Resource Management

- `GET /api/resources`: Get all resources
- `GET /api/resources/:id`: Get resource by ID
- `POST /api/resources`: Create new resource
- `PUT /api/resources/:id`: Update resource by ID
- `DELETE /api/resources/:id`: Delete resource by ID

### Topic Management

- `GET /api/topics`: Get all topics
- `GET /api/topics/:id`: Get topic by ID
- `POST /api/topics`: Create new topic
- `PUT /api/topics/:id`: Update topic by ID
- `DELETE /api/topics/:id`: Delete topic by ID

### Search

- `GET /api/search?query=<query>`: Search across all content types
- `GET /api/search/concepts?query=<query>`: Search concepts
- `GET /api/search/predicates?query=<query>`: Search predicates
- `GET /api/search/resources?query=<query>`: Search resources
- `GET /api/search/topics?query=<query>`: Search topics

## Content ID Format

Content IDs use the URN format:

- Concepts: `urn:uor:concept:<name>`
- Predicates: `urn:uor:predicate:<name>`
- Resources: `urn:uor:resource:<name>`
- Topics: `urn:uor:topic:<name>`

When accessing content by ID, use the full URN format:

```
GET /api/concepts/urn:uor:concept:prime-decomposition
```

## Examples

### Get All Concepts

```bash
curl -X GET http://localhost:3000/api/concepts
```

### Get Concept by ID

```bash
curl -X GET http://localhost:3000/api/concepts/urn:uor:concept:prime-decomposition
```

### Create New Concept

```bash
curl -X POST http://localhost:3000/api/concepts \
  -H "Content-Type: application/json" \
  -d '{
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": "urn:uor:concept:new-concept",
    "name": "New Concept",
    "description": "Description of the new concept"
  }'
```

### Search Content

```bash
curl -X GET http://localhost:3000/api/search?query=prime
```

## Validation

The UOR-MCP server implements a multi-layer validation pipeline:

1. **Request Validation**: Validates incoming requests against the MCP schema
2. **Content Validation**: Validates content against Schema.org and UOR-specific schemas
3. **Relationship Validation**: Validates relationships between content items

## Error Handling

The server returns standardized error responses:

- `400 Bad Request`: Invalid request or content
- `404 Not Found`: Content not found
- `403 Forbidden`: Unauthorized access
- `500 Internal Server Error`: Server error

Error responses include detailed information about the error:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid concept content",
    "data": [
      {
        "keyword": "required",
        "dataPath": "",
        "schemaPath": "#/required",
        "params": {
          "missingProperty": "name"
        },
        "message": "should have required property 'name'"
      }
    ]
  }
}
```
