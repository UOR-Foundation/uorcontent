# Schema.org Meta Templates

This directory contains JSON templates for the Schema.org meta vocabulary which defines the structure of Schema.org itself.

## Meta Vocabulary Templates

The meta vocabulary templates provide the foundation for creating Schema.org-compliant data structures:

### 1. SchemaThing.json
- The most generic Schema.org type
- Root of the type hierarchy
- Contains core properties shared by all types

### 2. SchemaClass.json
- Equivalent to rdfs:Class
- Used to define other Schema.org types
- Contains the structure for declaring classes

### 3. SchemaProperty.json
- Equivalent to rdf:Property
- Used to define properties and relationships
- Contains domain and range specifications

### 4. SchemaDataType.json
- Defines primitive data types
- Used for simple value types like Boolean, Text, Number, etc.

### 5. SchemaEnumeration.json
- Defines enumerated types
- Contains structure for enumerations that have a fixed set of values

### 6. SchemaEnumerationMember.json
- Defines individual members of an enumeration
- Used to create specific values within an enumeration

### 7. SchemaIntangible.json
- Represents non-physical or abstract items
- Subclass of Thing
- Parent class for many abstract types

### 8. SchemaCreativeWork.json
- Represents creative content
- Used for articles, documents, and other creative entities

### 9. SchemaStructuredValue.json
- Represents complex structured values
- Used when properties have more complex structure than literals

### 10. SchemaDefinedTerm.json
- Represents formally defined terms
- Used for glossary entries, dictionary terms, etc.

### 11. SchemaDefinedTermSet.json
- Represents collections of defined terms
- Used for glossaries, dictionaries, categorization schemes

### 12. SchemaPropertyValue.json
- Represents property-value pairs
- Used for structured property values with metadata

## Usage Guidelines

These templates provide the foundational structure for:

1. **Creating Schemas**: Define new types and properties using these meta templates
2. **Documentation**: Generate documentation for schema types and properties
3. **Validation**: Create validation rules for schema-based content
4. **Extensions**: Define extensions to the core Schema.org vocabulary

When creating schema definitions, follow these best practices:

- Use the most specific meta template for your purpose
- Include complete rdfs:comment and rdfs:label values
- Specify all domain and range constraints for properties
- Document type inheritance through subClassOf relationships
- Include all relevant property listings for classes

These meta templates enable a consistent approach to schema development and documentation within the Schema.org framework.