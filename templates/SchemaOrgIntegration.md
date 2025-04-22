# Schema.org Integration with UOR Framework

This document explains how to use the Schema.org submodule with the UOR Framework templates.

## Schema.org Repository Structure

The Schema.org definitions are included as a Git submodule in the `templates/schemaorg` directory. The most important files are:

- `data/releases/8.0/schema.jsonld` - The latest complete Schema.org vocabulary in JSON-LD format
- `data/releases/{version}/schema.jsonld` - Previous versions of the schema
- `data/ext/` - Extension vocabularies
- Various example files in the `data/` directory showing how to use Schema.org types

## Using Schema.org Definitions

### Accessing the Schema

The complete Schema.org definitions can be loaded programmatically from the `schema.jsonld` file:

```javascript
const fs = require('fs');
const schemaPath = './templates/schemaorg/data/releases/8.0/schema.jsonld';
const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Access the schema types
const schemaTypes = schemaData['@graph'];
```

### Finding Types and Properties

You can search for specific types or properties in the schema:

```javascript
// Find a specific type
function findType(name) {
  return schemaTypes.find(item => 
    item['@type'] === 'rdfs:Class' && 
    (item['@id'] === `schema:${name}` || item['rdfs:label'] === name)
  );
}

// Find properties for a type
function findPropertiesForType(typeName) {
  return schemaTypes.filter(item => 
    item['@type'] === 'rdf:Property' && 
    item['http://schema.org/domainIncludes']?.some(domain => 
      domain['@id'] === `schema:${typeName}`
    )
  );
}

const creativeWorkType = findType('CreativeWork');
const creativeWorkProperties = findPropertiesForType('CreativeWork');
```

## Integration with UOR Framework

### Extending UOR Templates with Schema.org

The UOR Framework templates (`Concept.json`, `Topic.json`, etc.) are already Schema.org compliant. These templates can be extended with additional Schema.org properties as needed:

1. Use the existing UOR template as a base
2. Reference the Schema.org submodule to find additional properties
3. Add those properties to the template

Example:

```javascript
// Start with a UOR Concept template
const conceptTemplate = require('./Concept.json');

// Add additional Schema.org properties
conceptTemplate.alternateName = "";
conceptTemplate.sameAs = [];
```

### Creating Custom Schema.org Templates

You can create custom templates for specific Schema.org types relevant to the UOR Framework:

1. Find the type in the Schema.org vocabulary
2. Extract its properties and structure
3. Create a new template file

```javascript
const fs = require('fs');
const schemaData = JSON.parse(fs.readFileSync('./templates/schemaorg/data/releases/8.0/schema.jsonld', 'utf8'));
const schemaTypes = schemaData['@graph'];

// Find a specific type
const typeData = schemaTypes.find(item => 
  item['@type'] === 'rdfs:Class' && 
  item['@id'] === 'schema:Dataset'
);

// Find properties for that type
const properties = schemaTypes.filter(item => 
  item['@type'] === 'rdf:Property' && 
  item['http://schema.org/domainIncludes']?.some(domain => 
    domain['@id'] === 'schema:Dataset'
  )
).map(prop => prop['rdfs:label']);

// Create a template
const template = {
  "@context": "https://schema.org",
  "@type": typeData['rdfs:label'],
  "name": "",
  "description": "",
  // Add other properties as needed
};

// Write the template to a file
fs.writeFileSync(`./templates/Schema${typeData['rdfs:label']}.json`, JSON.stringify(template, null, 2));
```

## Updating the Schema.org Submodule

To update the Schema.org definitions to the latest version:

```bash
cd templates/schemaorg
git pull origin master
cd ../..
git add templates/schemaorg
git commit -m "Update Schema.org to latest version"
```

## Benefits of Using the Submodule

1. **Complete Access**: Access the entire Schema.org vocabulary directly
2. **Versioning**: Use specific versions of Schema.org
3. **Documentation**: Reference the official documentation and examples
4. **Extensions**: Access Schema.org extensions
5. **Updates**: Easy updates when Schema.org evolves

## Best Practices

1. Reference the most specific Schema.org type appropriate for your content
2. Include all required Schema.org properties for each type
3. Use the Schema.org context in your JSON-LD documents
4. Validate your Schema.org markup using tools like Google's Structured Data Testing Tool
5. Keep the Schema.org submodule updated to access the latest vocabulary