#!/usr/bin/env node

/**
 * Fix all validation warnings
 * 
 * Master script that runs all warning fix scripts in sequence.
 */

const path = require('path');
const { fixPredicateWarnings } = require('./fix-predicate-warnings');
const { fixResourceWarnings } = require('./fix-resource-warnings');
const { fixTopicWarnings } = require('./fix-topic-warnings');

async function fixAllWarnings(directory) {
  console.log('===== Starting to fix all validation warnings =====\n');
  
  try {
    // Step 1: Fix predicate warnings
    console.log('STEP 1: Fixing predicate warnings');
    await fixPredicateWarnings(directory);
    console.log('\n');
    
    // Step 2: Fix resource warnings
    console.log('STEP 2: Fixing resource warnings');
    await fixResourceWarnings(directory);
    console.log('\n');
    
    // Step 3: Fix topic warnings
    console.log('STEP 3: Fixing topic warnings');
    await fixTopicWarnings(directory);
    console.log('\n');
    
    console.log('===== All warning fixes completed =====');
    console.log('Running final validation to check results...\n');
    
    // Run validation to see if all warnings are fixed
    const { exec } = require('child_process');
    exec(`cd ${path.resolve(directory, '../utils')} && node validate.js -d ${directory}`, 
      (error, stdout, stderr) => {
        if (error) {
          console.error(`\nSome warnings still exist. Error code: ${error.code}`);
          console.log(stdout);
          console.error(stderr);
        } else {
          console.log('SUCCESS: All warnings have been fixed!');
          console.log(stdout);
        }
      }
    );
  } catch (error) {
    console.error(`Error fixing warnings: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const directory = process.argv[2] || path.resolve(__dirname, '../converted');
  
  if (!directory) {
    console.error('Usage: node fix-all-warnings.js [directory]');
    process.exit(1);
  }
  
  fixAllWarnings(directory)
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixAllWarnings };