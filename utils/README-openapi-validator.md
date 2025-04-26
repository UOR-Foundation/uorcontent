# OpenAPI Validator for UOR Framework Content

This utility validates the UOR Framework content against an OpenAPI 3.0 specification. It ensures that the content structure matches the API definition, making it compatible with API-based applications.

## Repository

The content validated by this tool is available in the UOR Framework content repository:
- Main repository: https://github.com/afflom/uorcontent
- Raw content URL: https://raw.githubusercontent.com/afflom/uorcontent/main/converted

This repository URL is configured as a server in the OpenAPI specification, allowing consumers to access the content directly from GitHub.

## Installation

No additional installation is required. The validator uses the same dependencies as the other UOR Framework utilities:

- ajv
- ajv-formats
- chalk
- commander

## Usage

```bash
node validate-openapi.js [options]
```

### Options

- `-s, --spec <path>`: Path to OpenAPI specification file (default: '../converted/openapi-spec.json')
- `-c, --content <path>`: Path to content directory (default: '../converted')
- `-v, --verbose`: Display detailed validation information
- `-d, --deep`: Perform deep validation of content beyond index files
- `-f, --fix`: Suggest fixes for common schema issues (does not modify files)
- `-r, --remote-check`: Validate URLs against the GitHub repository server
- `--summary`: Only display summary results

### Examples

Validate content with default settings:
```bash
node validate-openapi.js
```

Validate content with detailed error information:
```bash
node validate-openapi.js --verbose
```

Get suggestions for fixing schema issues:
```bash
node validate-openapi.js --fix
```

Display only summary results:
```bash
node validate-openapi.js --summary
```

Validate against the GitHub repository server:
```bash
node validate-openapi.js --remote-check
```

## How It Works

The validator:

1. Loads the OpenAPI specification from the specified file
2. Initializes the schema validator with AJV (Another JSON Schema Validator)
3. Loads and processes the content indexes from the content directory
4. Validates each item in the indexes against the corresponding schema
5. Reports validation results, including errors and warnings

## Integration with CI/CD

You can integrate this validator into your CI/CD pipeline by adding it to your test scripts in package.json:

```json
"scripts": {
  "validate": "node validate.js",
  "validate:openapi": "node validate-openapi.js --summary",
  "test": "npm run validate && npm run validate:openapi"
}
```

## Extending or Modifying

To extend or modify the validator:

1. Update the OpenAPI specification in '/content/converted/openapi-spec.json'
2. If adding new content types, ensure they have corresponding schemas in the specification
3. Run the validator with the --fix option to get suggestions for missing schemas

## Troubleshooting

Common issues:

- **Schema not found errors**: The OpenAPI specification is missing a schema definition referenced by the content
- **oneOf validation errors**: Item structure doesn't match any of the schemas in a oneOf definition
- **Missing required property errors**: Content items are missing required properties defined in the schema

For most issues, running with the `--fix` option provides guidance on how to resolve the problems.