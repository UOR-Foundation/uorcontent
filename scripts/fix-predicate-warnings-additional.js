#!/usr/bin/env node

/**
 * Fix additional predicate warnings in the predicates-fixes directory
 * 
 * Addresses warnings in predicate files in the predicates-fixes subdirectory:
 * - Mismatches between name and valueReference.value
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function fixPredicateFixesWarnings(directory) {
  // Find all predicate-fixes files
  const predicateFixesDir = path.resolve(directory, 'predicates-fixes');
  const predicateFixesFiles = glob.sync(path.join(predicateFixesDir, '**/*.json'));
  
  console.log(`Found ${predicateFixesFiles.length} predicates-fixes files to check`);
  
  let fixedFiles = 0;
  let errorFiles = 0;
  
  // Process each file
  for (const filePath of predicateFixesFiles) {
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
          
        // Fix: Set valueReference.value to match name
        predicate.valueReference.value = predicate.name;
        modified = true;
        
        console.log(`Fixed mismatch in ${path.basename(filePath)}: Set valueReference.value to "${predicate.name}"`);
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
  console.log(`- Total files processed: ${predicateFixesFiles.length}`);
}

// Main execution
if (require.main === module) {
  const directory = process.argv[2] || path.resolve(__dirname, '../converted');
  
  if (!directory) {
    console.error('Usage: node fix-predicate-warnings-additional.js [directory]');
    process.exit(1);
  }
  
  fixPredicateFixesWarnings(directory)
    .then(() => {
      console.log('Completed fixing additional predicate warnings');
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixPredicateFixesWarnings };