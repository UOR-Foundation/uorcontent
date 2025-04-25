#!/usr/bin/env node

/**
 * UOR Framework Fix-Connect Predicate Converter
 * 
 * This script converts temporary fix-connect predicates to proper semantic relationships
 * while maintaining all connectivity information.
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// ANSI color codes for terminal output
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
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

// Set up CLI options
program
  .name('convert-fix-predicates')
  .description('Converts fix-connect predicates to proper semantic relationships')
  .version('1.0.0')
  .option('-c, --content-dir <path>', 'Path to the converted content directory', './content/converted')
  .option('-o, --output-dir <path>', 'Path to output the converted predicates', './content/converted/predicates')
  .option('-b, --backup', 'Create backups of original predicate files', false)
  .option('-v, --verbose', 'Display detailed information', false)
  .option('--dry-run', 'Show what would be done without making changes', false)
  .parse(process.argv);

const options = program.opts();
const contentDir = path.resolve(options.contentDir);
const outputDir = path.resolve(options.outputDir);

async function main() {
  try {
    console.log(colors.bold('UOR Framework Fix-Connect Predicate Converter'));
    console.log(`Content directory: ${contentDir}`);
    console.log(`Output directory: ${outputDir}`);
    
    if (options.dryRun) {
      console.log(colors.yellow('Running in dry-run mode - no changes will be made'));
    }
    
    // Find all fix-connect predicates
    const predicatesDir = path.join(contentDir, 'predicates');
    const fixPredicates = await findFixConnectPredicates(predicatesDir);
    
    console.log(`Found ${colors.blue(fixPredicates.length)} fix-connect predicates to convert`);
    
    // Process each predicate
    const results = {
      processed: 0,
      converted: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const predicateFile of fixPredicates) {
      try {
        const result = await processFixPredicate(predicateFile);
        
        if (result.converted) {
          results.converted++;
        } else if (result.skipped) {
          results.skipped++;
        }
        
        results.processed++;
      } catch (error) {
        console.error(colors.red(`Error processing ${predicateFile}: ${error.message}`));
        results.errors++;
      }
    }
    
    // Display results
    console.log(colors.bold('\nConversion Results:'));
    console.log(`Total processed: ${colors.blue(results.processed)}`);
    console.log(`Successfully converted: ${colors.green(results.converted)}`);
    console.log(`Skipped: ${colors.yellow(results.skipped)}`);
    console.log(`Errors: ${colors.red(results.errors)}`);
    
    if (!options.dryRun && results.converted > 0) {
      console.log(colors.cyan('\nNext steps:'));
      console.log('1. Run the validation script to check connectivity');
      console.log('2. Run the index generation script to update indices');
    }
    
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Find all fix-connect predicates in the specified directory
 */
async function findFixConnectPredicates(directory) {
  try {
    const files = await fs.readdir(directory);
    const fixPredicates = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(directory, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const predicate = JSON.parse(content);
        
        // Check if it's a fix-connect predicate
        const id = predicate['@id'] || '';
        const name = predicate.name || '';
        
        if (id.includes('fix-connect') || file.includes('fix-connect')) {
          fixPredicates.push({
            filePath,
            fileName: file,
            predicate
          });
        }
      } catch (error) {
        console.warn(colors.yellow(`Warning: Could not parse ${file}: ${error.message}`));
      }
    }
    
    return fixPredicates;
  } catch (error) {
    console.error(colors.red(`Error reading directory ${directory}: ${error.message}`));
    return [];
  }
}

/**
 * Process a fix-connect predicate and convert it to a proper semantic relationship
 */
async function processFixPredicate(predicateInfo) {
  const { filePath, fileName, predicate } = predicateInfo;
  const originalId = predicate['@id'];
  
  console.log(colors.cyan(`\nProcessing ${fileName}:`));
  
  // Check if this is actually a fix-connect predicate
  if (!originalId || !originalId.includes('fix-connect')) {
    console.log(colors.yellow(`Skipping ${fileName}: Not a fix-connect predicate`));
    return { skipped: true, reason: 'not-fix-connect' };
  }
  
  // Determine semantic relationship type from the predicate ID
  const semanticType = determineSemanticType(originalId, predicate);
  console.log(`Determined semantic type: ${colors.blue(semanticType)}`);
  
  // Get source and target from predicate
  const source = predicate.subjectOf?.['@id'] || predicate.subjectOf;
  const targets = Array.isArray(predicate.targetCollection) 
    ? predicate.targetCollection.map(t => typeof t === 'string' ? t : t['@id'])
    : [];
  
  if (!source || targets.length === 0) {
    console.log(colors.yellow(`Skipping ${fileName}: Missing source or target`));
    return { skipped: true, reason: 'missing-endpoints' };
  }
  
  // Generate a new ID for the converted predicate
  const newId = generateNewId(originalId, semanticType, source, targets[0]);
  console.log(`New ID: ${colors.blue(newId)}`);
  
  // Create a new predicate object with the proper semantic relationship
  const newPredicate = {
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
    "valueName": predicate.valueName || generateValueName(semanticType, source, targets[0]),
    "valueReference": {
      "@type": "PropertyValue",
      "propertyID": "uor:predicateType",
      "value": semanticType
    },
    "additionalProperty": predicate.additionalProperty || [
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
    "dateCreated": predicate.dateCreated || new Date().toISOString(),
    "dateModified": new Date().toISOString()
  };
  
  // Determine output path 
  const newFileName = fileName.replace('fix-connect-', `${semanticType}-`);
  const outputPath = path.join(outputDir, newFileName);
  
  // Create backup if requested
  if (options.backup && !options.dryRun) {
    const backupPath = `${filePath}.bak`;
    await fs.copyFile(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
  }
  
  // Write the new predicate
  if (!options.dryRun) {
    // Ensure output directory exists
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    
    await fs.writeFile(outputPath, JSON.stringify(newPredicate, null, 2));
    console.log(colors.green(`Converted predicate saved to ${outputPath}`));
    
    // Remove original if output directory is different
    if (path.resolve(outputDir) !== path.resolve(path.dirname(filePath))) {
      await fs.unlink(filePath);
      console.log(`Removed original predicate at ${filePath}`);
    }
  } else {
    console.log(colors.yellow('Would save converted predicate (dry run)'));
    if (options.verbose) {
      console.log(JSON.stringify(newPredicate, null, 2));
    }
  }
  
  return { converted: true, outputPath };
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

// Run the main function
main();