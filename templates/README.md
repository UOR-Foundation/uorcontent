# Schema.org Content Templates

This directory contains JSON templates for transforming UOR Framework content into a modular, schema.org-compliant format.

## Purpose

These templates enable:

1. **Modular Content Structure**: Breaking down monolithic content into discrete facts/concepts
2. **Dynamic Content Assembly**: Facts can be rearranged into different topics based on predicates
3. **Semantic Enrichment**: Schema.org typing provides standardized semantic structure
4. **Improved Discoverability**: Content becomes more machine-readable and searchable

## Template Types

### 1. InformationResource

Represents individual information modules or sections using schema.org's `CreativeWork` type.

### 2. Concept

Represents discrete mathematical concepts, theorems, or principles using schema.org's `DefinedTerm` type.

### 3. Topic

Represents broader subject areas that contain multiple concepts using schema.org's `CreativeWork` type.

### 4. FactPredicate

Links facts to topics and establishes relationships between concepts.

## Directory Structure

The converted content will be organized in the following directory structure:

```
/content/
  /templates/        # Template definitions
  /converted/
    /concepts/       # Individual concepts as JSON files
    /resources/      # Information resources as JSON files
    /topics/         # Topic definitions as JSON files
    /predicates/     # Fact predicates as JSON files
    /index/          # Index files for quick lookup
      concepts.json  # Index of all concepts
      topics.json    # Index of all topics
      predicates.json # Index of all predicates
```

## Usage Guidelines

1. **Fact Extraction**: Extract individual facts, concepts, and theorems from existing MDX content
2. **Template Application**: Format extracted content using the appropriate template
3. **Predicate Assignment**: Define how facts relate to each other using predicates
4. **Dynamic Assembly**: Rebuild content structures based on predicate relationships

## Conversion Process

1. Parse existing MDX files
2. Extract discrete knowledge units
3. Apply schema.org templates
4. Generate JSON documents
5. Establish predicate relationships

This transformation maintains all existing content while enhancing its modularity, interoperability, and semantic structure.