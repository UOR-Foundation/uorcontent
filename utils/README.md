# UOR Framework Content Utilities

This directory contains utilities for working with the Schema.org-formatted content of the UOR Framework.

## Available Utilities

### 1. Content Validator

Validates JSON content against Schema.org types and templates.

```bash
# Validate a single file
node validate.js --file ../converted/concepts/example.json

# Validate all files in a directory
node validate.js --directory ../converted

# Show detailed validation with warnings
node validate.js --directory ../converted --verbose

# Simplified usage with npm script
npm run validate:all
```

### 2. Content Fixing Utilities

Various utilities to fix common issues in content files:

```bash
# Fix predicate structure (additionalProperty format, missing fields)
node fix-predicates.js

# Create missing concept files for referenced concepts that don't exist
node fix-concept-references.js

# Fix [object Object] issues in hasPart references
node fix-object-references.js
```

### 3. Index Generator

Generates index files for efficient content lookup and navigation.

```bash
# Generate index files
node build-index.js

# Simplified usage with npm script
npm run generate-index
```

### 4. MDX Converter

Converts MDX content to Schema.org JSON format.

```bash
# Convert a single MDX file
node convert.js --input ../../uor-learning-app/pages/uor/overview.mdx

# Convert a directory of MDX files
node convert.js --input ../../uor-learning-app/pages/uor --output ../converted
```

## Installation

Install dependencies:

```bash
npm install
```

## Validation Process and Issue Resolution

1. **Run validation** to identify issues:
   ```bash
   node validate.js --directory ../converted
   ```

2. **Fix missing concept references**:
   ```bash
   node fix-concept-references.js
   ```

3. **Fix predicate structure issues**:
   ```bash
   node fix-predicates.js
   ```

4. **Regenerate index** after fixes:
   ```bash
   node build-index.js
   ```

5. **Fix object references** in topic files:
   ```bash
   node fix-object-references.js
   ```

6. **Adjust validator** if necessary:
   ```bash
   node fix-validator.js
   ```

## Schema.org Types

These utilities work with the following Schema.org types:

- `CreativeWork` - Base type for informational content and topics
- `DefinedTerm` - For concepts and definitions
- `PropertyValue` - For predicates and relationships
- `ItemList` - For index files

All content is validated against both the Schema.org standard and our custom templates.
