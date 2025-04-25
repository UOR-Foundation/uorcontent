# Fix-Connect Predicate Conversion

This document outlines the process for converting temporary fix-connect predicates to proper semantic relationships while maintaining all connectivity information.

## Background

The UOR Framework content currently contains many predicates with names like "fix-connect-concept-to-topic" that were generated automatically to ensure content connectivity. These predicates use generic relationship types like "relatedTo" or "relates" that don't convey meaningful semantic information.

This conversion process replaces these temporary fix-connect predicates with proper semantic relationships that better describe the relationship between concepts and topics.

## Semantic Relationship Mapping

The conversion script maps fix-connect predicates to appropriate semantic relationships based on keywords in the predicate ID and content:

| Pattern in ID | Semantic Type | Value Description |
|---------------|---------------|-------------------|
| axiom | explainsAxiom | explains axiom principles |
| concept | definesConcept | defines conceptual framework |
| framework | partOfFramework | integral component |
| application | hasApplication | applied domain |
| extension | extendsTo | extended domain |
| coherence | definesCoherence | coherence definition |
| foundation | providesFoundationFor | foundational element |
| structure | definesStructure | structural definition |
| definition | definesTerminology | terminological definition |
| property | hasProperty | defining property |
| coordinate | definesCoordinateSystem | coordinate system |
| architecture | definesArchitecture | architectural framework |
| system | describesMechanics | mechanical description |
| field | establishesField | field establishment |
| reference | providesReferenceFrame | reference frame |
| (default) | relatedTo | semantic relationship |

## Usage

The conversion script can be run as follows:

```bash
# Basic usage (dry run mode - just shows what would happen)
node content/scripts/convert-fix-predicates.js --dry-run

# Convert predicates and save to output directory
node content/scripts/convert-fix-predicates.js --content-dir ./content/converted --output-dir ./content/converted/predicates

# Create backups of original files
node content/scripts/convert-fix-predicates.js --backup
```

## Implementation Notes

When a fix-connect predicate is converted:

1. The predicate ID is changed from `fix-connect-concept-to-topic` to `semanticType-concept-to-topic`
2. The predicate name is changed from "relatedTo" to the determined semantic type
3. The value is changed from "related concept" to a more specific description
4. The predicateType is updated to match the semantic type
5. All connectivity information (subject, targets, properties) is maintained

## Benefits

This conversion process provides several benefits:

1. **Improved Semantics**: Predicates now represent the actual relationship between concepts and topics
2. **Better Discoverability**: Semantic relationships are easier to understand and navigate
3. **Maintained Connectivity**: All connectivity information is preserved, ensuring the content graph remains intact
4. **Cleaner Content Model**: Removes temporary/artificial naming patterns
5. **Enhanced Querying**: Enables more sophisticated queries based on relationship types

## Integration

After converting the fix-connect predicates, you should:

1. Run the validation script to ensure content connectivity is maintained
2. Update any indices or references that might have used the old predicate IDs
3. Update any code that specifically looks for "fix-connect" patterns

## Example Conversion

### Original Fix-Connect Predicate

```json
{
  "@context": "https://schema.org",
  "@type": "PropertyValue",
  "@id": "urn:uor:predicate:fix-connect-coherence-inner-product-to-temporal-coherence",
  "name": "relatedTo",
  "propertyID": "uor:predicate",
  "value": "related concept",
  "subjectOf": {
    "@id": "urn:uor:concept:coherence-inner-product"
  },
  "targetCollection": [
    "urn:uor:topic:temporal-coherence"
  ],
  "valueName": "Connects Coherence Inner Product to Temporal Coherence topic",
  "valueReference": {
    "@type": "PropertyValue",
    "propertyID": "uor:predicateType",
    "value": "relates"
  }
}
```

### Converted Semantic Relationship

```json
{
  "@context": "https://schema.org",
  "@type": "PropertyValue",
  "@id": "urn:uor:predicate:definesCoherence-coherence-inner-product-to-temporal-coherence",
  "name": "definesCoherence",
  "propertyID": "uor:predicate",
  "value": "coherence definition",
  "subjectOf": {
    "@id": "urn:uor:concept:coherence-inner-product"
  },
  "targetCollection": [
    "urn:uor:topic:temporal-coherence"
  ],
  "valueName": "Connects Coherence Inner Product to Temporal Coherence topic",
  "valueReference": {
    "@type": "PropertyValue",
    "propertyID": "uor:predicateType",
    "value": "definesCoherence"
  }
}
```