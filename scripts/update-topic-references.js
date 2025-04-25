#!/usr/bin/env node

/**
 * UOR Framework - Topic References Updater
 * 
 * This script updates the references in topic files from the old fix-connect 
 * predicate naming pattern to the new semantic relationship names.
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
  .name('update-topic-references')
  .description('Update topic references from fix-connect to semantic relationship names')
  .version('1.0.0')
  .option('-c, --content-dir <path>', 'Path to the content directory', './content/converted')
  .option('-d, --dry-run', 'Show what would be done without making changes', false)
  .option('-v, --verbose', 'Display detailed information', false)
  .parse(process.argv);

const options = program.opts();
const contentDir = path.resolve(options.contentDir);
const topicsDir = path.join(contentDir, 'topics');
const predicatesDir = path.join(contentDir, 'predicates');

// Define semantic relationships mapping like in convert-fix-predicates.js
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

// Determine semantic type based on predicate ID
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

// Transform old ID to new semantic ID
function transformToSemanticId(oldId) {
  const idParts = oldId.split(':');
  if (idParts.length < 3) return oldId; // Not a fully qualified ID
  
  const predicateId = idParts[idParts.length - 1];
  if (!predicateId.startsWith('fix-connect-')) return oldId; // Not a fix-connect predicate
  
  const semanticType = determineSemanticType(predicateId);
  const newPredicateId = predicateId.replace('fix-connect-', `${semanticType}-`);
  
  return `urn:uor:predicate:${newPredicateId}`;
}

// Main function
async function main() {
  try {
    console.log(colors.bold('UOR Framework Topic References Updater'));
    console.log(`Content directory: ${contentDir}`);
    
    if (options.dryRun) {
      console.log(colors.yellow('Running in dry-run mode - no changes will be made'));
    }
    
    // Read all topic files
    const files = await fs.readdir(topicsDir);
    const topicFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`\nFound ${topicFiles.length} topic files to process\n`);
    
    // Build a predicate map to quickly check which predicates exist
    const predicateMap = new Map();
    try {
      const predicateFiles = await fs.readdir(predicatesDir);
      for (const file of predicateFiles) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(predicatesDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const predicate = JSON.parse(content);
        if (predicate['@id']) {
          predicateMap.set(predicate['@id'], true);
        }
      }
      console.log(`Loaded ${predicateMap.size} predicates for reference checking`);
    } catch (err) {
      console.warn(colors.yellow(`Warning: Error loading predicates: ${err.message}`));
    }
    
    // Process each topic file
    for (const file of topicFiles) {
      const filePath = path.join(topicsDir, file);
      
      try {
        // Read and parse the topic file
        const content = await fs.readFile(filePath, 'utf8');
        const topic = JSON.parse(content);
        
        if (!Array.isArray(topic.hasPart)) {
          console.log(colors.yellow(`Skipping ${file}: No hasPart array`));
          continue;
        }
        
        // Track references that need updating
        let modified = false;
        const newHasPart = [];
        const updates = [];
        
        // Process each reference in hasPart
        for (const part of topic.hasPart) {
          if (typeof part === 'string' && part.includes('fix-connect-')) {
            // Convert fix-connect ID to semantic ID
            const newId = transformToSemanticId(part);
            
            // Check if the semantic predicate exists
            if (predicateMap.has(newId)) {
              newHasPart.push(newId);
              updates.push({ old: part, new: newId });
              modified = true;
            } else {
              // Keep the old reference if the new one doesn't exist
              newHasPart.push(part);
              console.log(colors.yellow(`Warning: Semantic predicate not found: ${newId}`));
            }
          } else {
            // Keep non-fix-connect references unchanged
            newHasPart.push(part);
          }
        }
        
        // Update the topic if modifications were made
        if (modified) {
          topic.hasPart = newHasPart;
          topic.dateModified = new Date().toISOString();
          
          // Display changes
          console.log(colors.green(`Updates for ${file}:`));
          updates.forEach(update => {
            console.log(`  ${colors.blue(update.old)} → ${colors.cyan(update.new)}`);
          });
          
          // Write the updated topic
          if (!options.dryRun) {
            await fs.writeFile(filePath, JSON.stringify(topic, null, 2));
            console.log(colors.green(`Updated ${file} with ${updates.length} changes`));
          } else {
            console.log(colors.yellow(`Would update ${file} with ${updates.length} changes (dry run)`));
          }
        } else {
          console.log(colors.blue(`No changes needed for ${file}`));
        }
      } catch (error) {
        console.error(colors.red(`Error processing ${file}: ${error.message}`));
      }
    }
    
    console.log(colors.bold('\nNext Steps:'));
    console.log('1. Validate connectivity with the updated references');
    console.log('2. Rebuild indexes to reflect the updated references');
    console.log('3. Regenerate Obsidian files if needed');
    
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