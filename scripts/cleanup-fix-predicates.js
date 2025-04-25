#!/usr/bin/env node

/**
 * UOR Framework Fix Predicates Cleanup Tool
 * 
 * This script cleans up improperly generated fix predicates by:
 * 1. Removing duplicate fix files from the predicates directory
 * 2. Cleaning up the related entries in Obsidian vault if needed
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
  .name('cleanup-fix-predicates')
  .description('Cleanup improperly generated fix predicates')
  .version('1.0.0')
  .option('-c, --content-dir <path>', 'Path to the content directory', './content')
  .option('-o, --obsidian-dir <path>', 'Path to the Obsidian vault directory', './client/obsidian-vault')
  .option('-d, --dry-run', 'Show what would be done without making changes', false)
  .option('-v, --verbose', 'Display detailed information', false)
  .parse(process.argv);

const options = program.opts();
const contentDir = path.resolve(options.contentDir);
const obsidianDir = path.resolve(options.obsidianDir);
const predicatesDir = path.join(contentDir, 'converted/predicates');
const obsidianPredicatesDir = path.join(obsidianDir, 'Predicates');

// Main function
async function main() {
  try {
    console.log(colors.bold('UOR Framework Fix Predicates Cleanup Tool'));
    console.log(`Content directory: ${contentDir}`);
    console.log(`Obsidian directory: ${obsidianDir}`);
    
    if (options.dryRun) {
      console.log(colors.yellow('Running in dry-run mode - no changes will be made'));
    }
    
    // Check if predicates directory exists
    try {
      await fs.access(predicatesDir);
    } catch (error) {
      console.error(colors.red(`Error: Predicates directory not found: ${predicatesDir}`));
      process.exit(1);
    }
    
    // Find and remove duplicate fix files
    await cleanupFixPredicates();
    
    // If Obsidian directory exists, clean up there too
    try {
      await fs.access(obsidianPredicatesDir);
      await cleanupObsidianFixPredicates();
    } catch (error) {
      console.log(colors.yellow(`Obsidian predicates directory not found, skipping Obsidian cleanup`));
    }
    
    console.log(colors.green('\nCleanup completed.'));
    
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Cleanup fix predicates in content directory
async function cleanupFixPredicates() {
  console.log(colors.bold('\nCleaning up fix predicates in content directory:'));
  
  // Read all predicate files
  const files = await fs.readdir(predicatesDir);
  
  // Find problematic files with naming patterns
  const problematicFiles = files.filter(file => {
    return (
      file.includes('connect-fix-connect-') || // Double "connect" prefix
      file.startsWith('UOR-P-connect-fix-')    // "connect" before "fix"
    );
  });
  
  console.log(`Found ${problematicFiles.length} problematic fix predicate files`);
  
  // Process each problematic file
  let removedCount = 0;
  let renamedCount = 0;
  
  for (const file of problematicFiles) {
    const filePath = path.join(predicatesDir, file);
    
    // Try to read the file content
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(content);
      const id = json['@id'];
      
      // Determine if there's a better-named duplicate
      const correctFileName = determineCorrectFileName(id, file);
      const correctFilePath = path.join(predicatesDir, correctFileName);
      
      // Check if the correct file already exists
      try {
        await fs.access(correctFilePath);
        
        // If the correct file exists, we can remove the problematic one
        if (!options.dryRun) {
          await fs.unlink(filePath);
          console.log(colors.green(`Removed duplicate file: ${file} (using ${correctFileName} instead)`));
        } else {
          console.log(colors.yellow(`Would remove duplicate file: ${file} (using ${correctFileName} instead)`));
        }
        removedCount++;
      } catch (error) {
        // If the correct file doesn't exist, rename this one
        if (!options.dryRun) {
          await fs.rename(filePath, correctFilePath);
          console.log(colors.green(`Renamed: ${file} → ${correctFileName}`));
        } else {
          console.log(colors.yellow(`Would rename: ${file} → ${correctFileName}`));
        }
        renamedCount++;
      }
    } catch (error) {
      console.error(colors.red(`Error processing ${file}: ${error.message}`));
    }
  }
  
  console.log(colors.green(`Removed ${removedCount} duplicate files`));
  console.log(colors.green(`Renamed ${renamedCount} files`));
}

// Cleanup fix predicates in Obsidian vault
async function cleanupObsidianFixPredicates() {
  console.log(colors.bold('\nCleaning up fix predicates in Obsidian vault:'));
  
  // Read all predicate files in Obsidian
  const files = await fs.readdir(obsidianPredicatesDir);
  
  // Find problematic files with naming patterns
  const problematicFiles = files.filter(file => {
    return (
      file.includes('connect-fix-connect-') || // Double "connect" prefix
      file.startsWith('fix-connect-')         // Files that should not be in Obsidian
    );
  });
  
  console.log(`Found ${problematicFiles.length} problematic fix predicate files in Obsidian`);
  
  // Process each problematic file
  let removedCount = 0;
  
  for (const file of problematicFiles) {
    const filePath = path.join(obsidianPredicatesDir, file);
    
    // Read file content to get ID
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Extract ID from YAML frontmatter
      const idMatch = content.match(/id: "([^"]+)"/);
      const id = idMatch ? idMatch[1] : null;
      
      if (id) {
        // Remove the problematic file
        if (!options.dryRun) {
          await fs.unlink(filePath);
          console.log(colors.green(`Removed problematic Obsidian file: ${file}`));
        } else {
          console.log(colors.yellow(`Would remove problematic Obsidian file: ${file}`));
        }
        removedCount++;
      } else {
        console.log(colors.yellow(`Could not extract ID from ${file}, skipping`));
      }
    } catch (error) {
      console.error(colors.red(`Error processing ${file}: ${error.message}`));
    }
  }
  
  console.log(colors.green(`Removed ${removedCount} problematic files from Obsidian vault`));
}

// Determine the correct filename for a predicate
function determineCorrectFileName(id, currentFileName) {
  if (!id) return currentFileName;
  
  // Extract the predicate ID from the URN
  let predicateId = '';
  if (id.includes('urn:uor:predicate:')) {
    predicateId = id.replace('urn:uor:predicate:', '');
  } else if (id.includes(':predicate:')) {
    predicateId = id.split(':predicate:')[1];
  } else {
    return currentFileName;
  }
  
  // Create a proper filename based on the predicate type
  if (predicateId.startsWith('fix-connect-')) {
    return `UOR-P-${predicateId}.json`;
  } else {
    return `UOR-P-${predicateId}.json`;
  }
}

// Run the main function
main();