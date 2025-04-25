#!/usr/bin/env node

/**
 * Fix predicate warnings script
 * 
 * Addresses warnings in predicate files, specifically:
 * - Mismatches between name and valueReference.value
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function fixPredicateWarnings(directory) {
  // Find all predicate files
  const predicateDir = path.resolve(directory, 'predicates');
  const predicateFiles = glob.sync(path.join(predicateDir, '**/*.json'));
  
  console.log(`Found ${predicateFiles.length} predicate files to check`);
  
  let fixedFiles = 0;
  let errorFiles = 0;
  
  // Process each file
  for (const filePath of predicateFiles) {
    try {
      // Read and parse the file
      const content = await fs.readFile(filePath, 'utf8');
      const predicate = JSON.parse(content);
      
      let modified = false;
      
      // Check for name/valueReference.value mismatch
      if (predicate.valueReference && 
          predicate.valueReference.value && 
          predicate.name && 
          predicate.valueReference.value !== predicate.name) {
        
        // Skip if the valueReference.name indicates it's for strength/weight
        if (!predicate.valueReference.name || 
            !(predicate.valueReference.name.toLowerCase().includes('strength') || 
              predicate.valueReference.name.toLowerCase().includes('weight') ||
              predicate.valueReference.name.toLowerCase().includes('relation'))) {
          
          // Fix: Set valueReference.value to match name
          predicate.valueReference.value = predicate.name;
          modified = true;
          
          console.log(`Fixed mismatch in ${path.basename(filePath)}: Set valueReference.value to "${predicate.name}"`);
        }
      }
      
      // Write back if modified
      if (modified) {
        await fs.writeFile(filePath, JSON.stringify(predicate, null, 2), 'utf8');
        fixedFiles++;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}: ${error.message}`);
      errorFiles++;
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`- Fixed ${fixedFiles} files`);
  console.log(`- Encountered errors in ${errorFiles} files`);
  console.log(`- Total files processed: ${predicateFiles.length}`);
}

// Main execution
if (require.main === module) {
  const directory = process.argv[2] || path.resolve(__dirname, '../converted');
  
  if (!directory) {
    console.error('Usage: node fix-predicate-warnings.js [directory]');
    process.exit(1);
  }
  
  fixPredicateWarnings(directory)
    .then(() => {
      console.log('Completed fixing predicate warnings');
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixPredicateWarnings };