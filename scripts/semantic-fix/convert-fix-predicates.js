#!/usr/bin/env node

/**
 * UOR Framework - Fix-Connect Predicate Converter
 * 
 * This script transforms fix-connect predicates into semantically meaningful relationships.
 * It replaces artificial "fix-connect-*" names with proper predicates that have semantic meaning.
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

// Set up CLI options
program
  .name('convert-fix-predicates')
  .description('Convert fix-connect predicates to semantic relationships')
  .version('1.0.0')
  .option('-c, --content-dir <path>', 'Path to the content directory', './content/converted')
  .option('-o, --output-dir <path>', 'Path to write the updated predicates', './content/converted/predicates')
  .option('-d, --dry-run', 'Show what would be done without making changes', false)
  .option('-v, --verbose', 'Display detailed information', false)
  .parse(process.argv);

const options = program.opts();
const contentDir = path.resolve(options.contentDir);
const outputDir = path.resolve(options.outputDir);
const predicatesDir = path.join(contentDir, 'predicates');

// Define semantic relationships mapping
const semanticMap = {
  // Base mappings - used as fallbacks
  'default': 'relatedTo',
  
  // Semantic relationship mappings based on content patterns
  'coherence': 'definesCoherence',
  'coherence-norm': 'definesCoherenceNorm',
  'coherence-inner-product': 'definesCoherenceProduct',
  'coherence-metric': 'definesCoherenceMetric',
  'coherence-minimization': 'demonstratesCoherenceMinimization',
  'coherence-preserving-dynamics': 'implementsCoherenceDynamics',
  'coherence-as-value': 'establishesAsValue',
  
  'prime': 'definesPrimeStructure',
  'prime-coordinate': 'definesPrimeCoordinates',
  'prime-properties': 'definesPrimeProperties',
  'prime-applications': 'hasPrimeApplications',
  'prime-valuation': 'definesPrimeValuation',
  'prime-formula': 'definesPrimeFormalism',
  'prime-uor-role': 'establishesPrimeRole',
  
  'axiom': 'definesAxiom',
  'intrinsic-prime-definition': 'definesIntrinsicPrimes',
  'hyperbolic-prime-geometry': 'definesHyperbolicGeometry',
  
  'application': 'hasApplication',
  'extension': 'extendsTo',
  'representation': 'representsAs',
  
  'neural-coherence-architecture': 'implementsNeuralArchitecture',
  'unified-coherence-field': 'establishesCoherenceField',
  'quantum-coherence-systems': 'implementsQuantumSystem',
  
  'formal': 'formalizesAs',
  'formal-arithmetization': 'formalizesMathematically',
  'formal-domain-extensions': 'extendsToDomain',
  'formal-geometric-extensions': 'extendsToGeometry',
  'formal-topological-extensions': 'extendsToTopology',
  
  'transcendence': 'transcendsVia',
  'learning-systems-architecture': 'implementsLearningArchitecture',
  'reference-frame': 'definesReferenceFrame'
};

// Match a concept name to an appropriate semantic relationship
function determineSemanticType(id) {
  // Extract the content part (between fix-connect and to-topic)
  const parts = id.split('-to-');
  if (parts.length !== 2) return semanticMap['default']; 
  
  const conceptPart = parts[0].replace('fix-connect-', '');
  
  // Try to find direct matches first
  if (semanticMap[conceptPart]) {
    return semanticMap[conceptPart];
  }
  
  // Try to match partial patterns
  for (const [pattern, relationship] of Object.entries(semanticMap)) {
    if (pattern === 'default') continue;
    if (conceptPart.includes(pattern)) {
      return relationship;
    }
  }
  
  // Provide more specific relationship types for axioms
  if (conceptPart.startsWith('axiom-')) {
    const axiomType = conceptPart.replace('axiom-', '');
    
    if (axiomType.includes('statement')) return 'definesAxiomStatement';
    if (axiomType.includes('insights')) return 'providesAxiomInsights'; 
    if (axiomType.includes('formalization')) return 'formalizesAxiom';
    if (axiomType.includes('connections')) return 'establishesAxiomConnections';
  }
  
  // Default relationship
  return semanticMap['default'];
}

// Generate a better ID for the relationship
function generateSemanticId(oldId, semanticType) {
  return oldId.replace('fix-connect-', semanticType + '-');
}

// Main function
async function main() {
  try {
    console.log(colors.bold('UOR Framework Fix-Connect Predicate Converter'));
    console.log(`Content directory: ${contentDir}`);
    console.log(`Output directory: ${outputDir}`);
    
    if (options.dryRun) {
      console.log(colors.yellow('Running in dry-run mode - no changes will be made'));
    }
    
    // Read all predicate files
    const files = await fs.readdir(predicatesDir);
    const fixFiles = files.filter(file => file.includes('fix-connect-'));
    
    console.log(`\nFound ${fixFiles.length} fix-connect predicates to convert\n`);
    
    const converted = [];
    const skipped = [];
    
    // Process each fix-connect file
    for (const file of fixFiles) {
      const filePath = path.join(predicatesDir, file);
      
      try {
        // Read and parse the file
        const data = await fs.readFile(filePath, 'utf8');
        const predicate = JSON.parse(data);
        
        // Extract ID and generate semantically meaningful relationship
        const oldId = predicate['@id'].split(':').pop();
        const semanticType = determineSemanticType(oldId);
        const newId = generateSemanticId(oldId, semanticType);
        
        // Create a new predicate with semantically meaningful properties
        const newPredicate = {
          ...predicate,
          '@id': predicate['@id'].replace(oldId, newId),
          'name': semanticType,
          'valueReference': {
            '@type': 'PropertyValue',
            'propertyID': 'uor:predicateType',
            'value': semanticType
          }
        };
        
        // Update valueName to be more descriptive
        const conceptName = oldId.split('-to-')[0].replace('fix-connect-', '');
        const topicName = oldId.split('-to-')[1];
        newPredicate.valueName = `${semanticType} relationship from ${conceptName} to ${topicName}`;
        
        // If there's an additionalProperty array with auto-generated marker, remove it
        if (Array.isArray(newPredicate.additionalProperty)) {
          newPredicate.additionalProperty = newPredicate.additionalProperty.filter(
            prop => prop.propertyID !== 'uor:auto-generated'
          );
          
          // Add semantic relationship marker
          newPredicate.additionalProperty.push({
            '@type': 'PropertyValue',
            'propertyID': 'uor:semanticRelationship',
            'value': true
          });
        }
        
        // Generate new filename
        const newFilename = `UOR-P-${semanticType}-${conceptName}-to-${topicName}.json`;
        const newFilePath = path.join(outputDir, newFilename);
        
        // Save the file or display what would be done
        if (!options.dryRun) {
          await fs.writeFile(newFilePath, JSON.stringify(newPredicate, null, 2));
          
          // Remove old file if new filename is different
          if (file !== newFilename) {
            await fs.unlink(filePath);
          }
          
          console.log(colors.green(`Converted: ${file} → ${newFilename}`));
        } else {
          console.log(colors.yellow(`Would convert: ${file} → ${newFilename}`));
          console.log(colors.blue(`  Old predicate type: relatedTo`));
          console.log(colors.blue(`  New predicate type: ${semanticType}`));
        }
        
        converted.push({file, newFilename, semanticType});
      } catch (error) {
        console.error(colors.red(`Error processing ${file}: ${error.message}`));
        skipped.push({file, error: error.message});
      }
    }
    
    console.log(colors.bold('\nConversion Summary:'));
    console.log(`${colors.green(`${converted.length} predicates converted`)}`);
    console.log(`${colors.red(`${skipped.length} predicates skipped`)}`);
    
    if (converted.length > 0) {
      console.log(colors.bold('\nSemantic Relationships Created:'));
      const semanticTypes = {};
      converted.forEach(item => {
        semanticTypes[item.semanticType] = (semanticTypes[item.semanticType] || 0) + 1;
      });
      
      Object.entries(semanticTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${colors.cyan(type)}: ${count} predicates`);
        });
    }
    
    console.log(colors.bold('\nNext Steps:'));
    console.log('1. Update any references to the old predicate IDs');
    console.log('2. Rebuild indexes with the new predicate names');
    console.log('3. Regenerate Obsidian files for better semantic links');
    
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the script
main();