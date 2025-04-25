#!/usr/bin/env node

/**
 * Test script to demonstrate the conversion of a fix-connect predicate
 */

const fs = require('fs').promises;
const path = require('path');

// Sample fix-connect predicate to demonstrate conversion
const SAMPLE_PREDICATE = {
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
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "propertyID": "uor:weight",
      "value": 1
    },
    {
      "@type": "PropertyValue",
      "propertyID": "uor:confidence",
      "value": 0.8
    }
  ],
  "dateCreated": "2025-04-25T07:08:46.207Z",
  "dateModified": "2025-04-25T07:08:46.207Z"
};

// Predicate type mapping (from fix-connect patterns to semantic relationships)
const PREDICATE_TYPE_MAPPING = {
  // Default fallback
  'default': 'relatedTo',
  
  // Specific mappings based on content patterns
  'axiom': 'explainsAxiom',
  'concept': 'definesConcept',
  'framework': 'partOfFramework',
  'application': 'hasApplication',
  'extension': 'extendsTo',
  'coherence': 'definesCoherence',
  'foundation': 'providesFoundationFor',
  'structure': 'definesStructure',
  'definition': 'definesTerminology',
  'property': 'hasProperty',
  'coordinate': 'definesCoordinateSystem',
  'architecture': 'definesArchitecture',
  'system': 'describesMechanics',
  'field': 'establishesField',
  'reference': 'providesReferenceFrame'
};

/**
 * Main function to demonstrate predicate conversion
 */
async function main() {
  console.log('Fix-Connect Predicate Conversion Demonstration\n');
  
  // Display the original predicate
  console.log('ORIGINAL PREDICATE:');
  console.log(JSON.stringify(SAMPLE_PREDICATE, null, 2));
  console.log('\n----------------------------\n');
  
  // Determine semantic relationship type
  const originalId = SAMPLE_PREDICATE['@id'];
  const semanticType = determineSemanticType(originalId, SAMPLE_PREDICATE);
  console.log(`Determined semantic type: ${semanticType}`);
  
  // Get source and target from predicate
  const source = SAMPLE_PREDICATE.subjectOf?.['@id'] || SAMPLE_PREDICATE.subjectOf;
  const targets = Array.isArray(SAMPLE_PREDICATE.targetCollection) 
    ? SAMPLE_PREDICATE.targetCollection.map(t => typeof t === 'string' ? t : t['@id'])
    : [];
  
  // Generate a new ID
  const newId = generateNewId(originalId, semanticType, source, targets[0]);
  console.log(`New ID: ${newId}`);
  
  // Create the converted predicate
  const convertedPredicate = {
    "@context": "https://schema.org",
    "@type": "PropertyValue",
    "@id": newId,
    "name": semanticType,
    "propertyID": "uor:predicate",
    "value": determineValueFromType(semanticType),
    "subjectOf": {
      "@id": source
    },
    "targetCollection": targets,
    "valueName": SAMPLE_PREDICATE.valueName || generateValueName(semanticType, source, targets[0]),
    "valueReference": {
      "@type": "PropertyValue",
      "propertyID": "uor:predicateType",
      "value": semanticType
    },
    "additionalProperty": SAMPLE_PREDICATE.additionalProperty || [
      {
        "@type": "PropertyValue",
        "propertyID": "uor:weight",
        "value": 1.0
      },
      {
        "@type": "PropertyValue",
        "propertyID": "uor:confidence",
        "value": 0.9
      }
    ],
    "dateCreated": SAMPLE_PREDICATE.dateCreated,
    "dateModified": new Date().toISOString()
  };
  
  // Display the converted predicate
  console.log('\nCONVERTED PREDICATE:');
  console.log(JSON.stringify(convertedPredicate, null, 2));
  
  // Explain the improvements
  console.log('\nIMPROVEMENTS:');
  console.log(`1. Changed predicate name from "${SAMPLE_PREDICATE.name}" to "${semanticType}"`);
  console.log(`2. Changed value from "${SAMPLE_PREDICATE.value}" to "${convertedPredicate.value}"`);
  console.log(`3. Changed predicateType from "${SAMPLE_PREDICATE.valueReference.value}" to "${semanticType}"`);
  console.log(`4. Updated ID to reflect semantic relationship: "${newId}"`);
  console.log('5. Maintained all connectivity information (subject, targets, properties)');
}

/**
 * Determine the appropriate semantic relationship type based on the predicate ID and content
 */
function determineSemanticType(id, predicate) {
  // Extract concept and topic from ID
  const parts = id.split('fix-connect-')[1]?.split('-to-');
  
  if (!parts || parts.length !== 2) {
    return PREDICATE_TYPE_MAPPING.default;
  }
  
  const [conceptPart, topicPart] = parts;
  
  // Look for keywords in the concept and topic parts
  for (const [keyword, semanticType] of Object.entries(PREDICATE_TYPE_MAPPING)) {
    if (keyword === 'default') continue;
    
    if (conceptPart.includes(keyword) || topicPart.includes(keyword)) {
      return semanticType;
    }
  }
  
  // If value already exists and isn't "related concept", use that
  if (predicate.valueReference?.value && 
      predicate.valueReference.value !== 'relates' &&
      predicate.valueReference.value !== 'related concept') {
    return predicate.valueReference.value;
  }
  
  // Default to relatedTo
  return PREDICATE_TYPE_MAPPING.default;
}

/**
 * Generate a new predicate ID based on the semantic type and endpoints
 */
function generateNewId(originalId, semanticType, source, target) {
  // Extract the entity names from URNs
  const sourceEntity = source.split(':').pop();
  const targetEntity = target.split(':').pop();
  
  // Create a new ID with the semantic type
  return `urn:uor:predicate:${semanticType}-${sourceEntity}-to-${targetEntity}`;
}

/**
 * Generate a value description based on the semantic type
 */
function determineValueFromType(semanticType) {
  switch (semanticType) {
    case 'explainsAxiom':
      return 'explains axiom principles';
    case 'definesConcept':
      return 'defines conceptual framework';
    case 'partOfFramework':
      return 'integral component';
    case 'hasApplication':
      return 'applied domain';
    case 'extendsTo':
      return 'extended domain';
    case 'definesCoherence':
      return 'coherence definition';
    case 'providesFoundationFor':
      return 'foundational element';
    case 'definesStructure':
      return 'structural definition';
    case 'definesTerminology':
      return 'terminological definition';
    case 'hasProperty':
      return 'defining property';
    case 'definesCoordinateSystem':
      return 'coordinate system';
    case 'definesArchitecture':
      return 'architectural framework';
    case 'describesMechanics':
      return 'mechanical description';
    case 'establishesField':
      return 'field establishment';
    case 'providesReferenceFrame':
      return 'reference frame';
    default:
      return 'semantic relationship';
  }
}

/**
 * Generate a descriptive value name
 */
function generateValueName(semanticType, source, target) {
  // Extract readable names from the URNs
  const sourceName = source.split(':').pop().replace(/-/g, ' ');
  const targetName = target.split(':').pop().replace(/-/g, ' ');
  
  switch (semanticType) {
    case 'explainsAxiom':
      return `${sourceName} explains axiom principles for ${targetName}`;
    case 'definesConcept':
      return `${sourceName} defines conceptual framework for ${targetName}`;
    case 'partOfFramework':
      return `${sourceName} is an integral component of ${targetName}`;
    case 'hasApplication':
      return `${sourceName} has application in ${targetName}`;
    case 'extendsTo':
      return `${sourceName} extends to ${targetName}`;
    case 'definesCoherence':
      return `${sourceName} defines coherence properties for ${targetName}`;
    case 'providesFoundationFor':
      return `${sourceName} provides foundation for ${targetName}`;
    default:
      return `${sourceName} is related to ${targetName}`;
  }
}

// Run the demonstration
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});