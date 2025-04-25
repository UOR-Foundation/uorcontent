#!/usr/bin/env node

/**
 * UOR Framework Content Filename Normalizer
 * 
 * This script normalizes filenames in the UOR Framework content directory
 * to ensure consistent naming conventions across all content types.
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// Main normalization function
async function normalizeFilenames(contentDir) {
  console.log(`Normalizing filenames in: ${contentDir}\n`);
  
  // Track numbers of files processed and renamed
  const stats = {
    conceptsProcessed: 0,
    conceptsRenamed: 0,
    resourcesProcessed: 0,
    resourcesRenamed: 0,
    topicsProcessed: 0,
    topicsRenamed: 0,
    predicatesProcessed: 0,
    predicatesRenamed: 0,
    predicatesFixesProcessed: 0,
    predicatesFixesRenamed: 0
  };
  
  try {
    // Normalize predicates filenames
    await normalizePredicates(contentDir, stats);
    
    // Normalize predicates-fixes filenames
    await normalizePredicatesFixes(contentDir, stats);
    
    // Display summary
    console.log('\nFilename Normalization Summary:');
    console.log(`Concepts: ${stats.conceptsRenamed}/${stats.conceptsProcessed} renamed`);
    console.log(`Resources: ${stats.resourcesRenamed}/${stats.resourcesProcessed} renamed`);
    console.log(`Topics: ${stats.topicsRenamed}/${stats.topicsProcessed} renamed`);
    console.log(`Predicates: ${stats.predicatesRenamed}/${stats.predicatesProcessed} renamed`);
    console.log(`Predicates-fixes: ${stats.predicatesFixesRenamed}/${stats.predicatesFixesProcessed} renamed`);
    
    console.log('\nFilename normalization completed successfully!');
  } catch (error) {
    console.error(`Error normalizing filenames: ${error.message}`);
    process.exit(1);
  }
}

// Normalize predicate filenames
async function normalizePredicates(contentDir, stats) {
  const predicatesDir = path.join(contentDir, 'predicates');
  const files = glob.sync(path.join(predicatesDir, '*.json'));
  
  console.log(`Processing ${files.length} predicate files...`);
  stats.predicatesProcessed = files.length;
  
  for (const file of files) {
    const fileName = path.basename(file);
    
    try {
      // Read content to get the ID and determine proper filename
      const content = await fs.readFile(file, 'utf8');
      const predicate = JSON.parse(content);
      const id = predicate['@id'] || '';
      
      // Get predicateId from the id value
      let predicateId = '';
      if (id.includes('urn:uor:predicate:')) {
        predicateId = id.replace('urn:uor:predicate:', '');
      } else if (id.includes('predicate/')) {
        predicateId = id.split('predicate/')[1];
      }
      
      // Different naming patterns for different predicate types
      let newFileName = '';
      
      if (fileName.startsWith('UOR-P-fix-connect-') || fileName.startsWith('UOR-P-connect-fix-')) {
        // This is a connection fix predicate, normalize to consistent pattern
        newFileName = `UOR-P-fix-${predicateId}.json`;
      } else if (fileName.startsWith('UOR-P-')) {
        // Regular predicate, keep the UOR-P prefix
        newFileName = fileName;
      } else {
        // Non-standard predicate filename
        if (predicateId) {
          newFileName = `UOR-P-${predicateId}.json`;
        } else {
          // Default case if no id pattern is recognized
          newFileName = `UOR-P-${fileName}`;
        }
      }
      
      // Rename if filename has changed
      if (newFileName !== fileName && newFileName !== '') {
        const newFilePath = path.join(predicatesDir, newFileName);
        await fs.rename(file, newFilePath);
        console.log(`Renamed: ${fileName} → ${newFileName}`);
        stats.predicatesRenamed++;
      }
    } catch (error) {
      console.error(`Error processing ${fileName}: ${error.message}`);
    }
  }
}

// Normalize predicate-fixes filenames
async function normalizePredicatesFixes(contentDir, stats) {
  const predicatesFixesDir = path.join(contentDir, 'predicates-fixes');
  
  try {
    // Check if directory exists
    await fs.access(predicatesFixesDir);
  } catch (error) {
    console.log('No predicates-fixes directory found. Skipping.');
    return;
  }
  
  const files = glob.sync(path.join(predicatesFixesDir, '*.json'));
  
  console.log(`\nProcessing ${files.length} predicate-fixes files...`);
  stats.predicatesFixesProcessed = files.length;
  
  for (const file of files) {
    const fileName = path.basename(file);
    
    try {
      // Read content to get the ID and determine proper filename
      const content = await fs.readFile(file, 'utf8');
      const predicate = JSON.parse(content);
      const id = predicate['@id'] || '';
      
      // Get predicateId from the id value
      let predicateId = '';
      if (id.includes('urn:uor:predicate:fix-')) {
        predicateId = id.replace('urn:uor:predicate:fix-', '');
      } else if (id.includes('predicate/fix-')) {
        predicateId = id.split('predicate/fix-')[1];
      }
      
      // Create standard filename
      let newFileName = '';
      
      if (predicateId) {
        newFileName = `UOR-P-fix-${predicateId}.json`;
      } else {
        // Use existing name but normalize prefix
        const baseName = fileName.replace(/^fix-/, '');
        newFileName = `UOR-P-fix-${baseName}`;
      }
      
      // Rename if filename has changed
      if (newFileName !== fileName && newFileName !== '') {
        const newFilePath = path.join(predicatesFixesDir, newFileName);
        await fs.rename(file, newFilePath);
        console.log(`Renamed: ${fileName} → ${newFileName}`);
        stats.predicatesFixesRenamed++;
      }
    } catch (error) {
      console.error(`Error processing ${fileName}: ${error.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const contentDir = process.argv[2] || path.resolve(__dirname, '../converted');
  
  normalizeFilenames(contentDir)
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { normalizeFilenames };