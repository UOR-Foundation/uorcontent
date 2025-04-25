#!/usr/bin/env node

/**
 * UOR Framework Content Connectivity Fix Applier
 * 
 * This script applies fixes from the fixes directory to solve connectivity issues
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
  .name('apply-connectivity-fixes')
  .description('Applies fixes to solve content connectivity issues')
  .version('1.0.0')
  .option('-c, --content-dir <path>', 'Path to the converted content directory', './content/converted')
  .option('-f, --fixes-dir <path>', 'Path to the fixes directory', './content/fixes')
  .option('-v, --verbose', 'Display detailed information', false)
  .option('--dry-run', 'Show what would be done without making changes', false)
  .option('--cleanup', 'Remove the fix predicates and start fresh', false)
  .parse(process.argv);

const options = program.opts();
const contentDir = path.resolve(options.contentDir);
const fixesDir = path.resolve(options.fixesDir);

async function main() {
  try {
    console.log(colors.bold('UOR Framework Content Connectivity Fix Applier'));
    console.log(`Content directory: ${contentDir}`);
    console.log(`Fixes directory: ${fixesDir}`);
    
    if (options.dryRun) {
      console.log(colors.yellow('Running in dry-run mode - no changes will be made'));
    }
    
    if (options.cleanup) {
      await cleanupFixPredicates();
    }
    
    // Apply topic updates
    await applyTopicUpdates();
    
    // Copy predicate fixes to predicates directory
    const predicateMap = await copyPredicateFixes();
    
    // Update topic files to include fix predicates
    await updateTopicsWithFixPredicates(predicateMap);
    
    console.log(colors.green('\nFix application completed.'));
    console.log(colors.cyan('\nNext steps:'));
    console.log('1. Run the validation script to check connectivity');
    console.log('2. Run the index generation script to update indices');
    
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

async function cleanupFixPredicates() {
  console.log(colors.bold('\nCleaning up fix predicates:'));
  
  const predicatesDir = path.join(contentDir, 'predicates');
  try {
    const predicateFiles = await fs.readdir(predicatesDir);
    
    // Find files with 'fix-connect' in the name
    const fixPredicateFiles = predicateFiles.filter(file => 
      file.includes('fix-connect') && file.endsWith('.json')
    );
    
    console.log(`Found ${fixPredicateFiles.length} fix predicates to remove`);
    
    if (!options.dryRun) {
      for (const file of fixPredicateFiles) {
        const filePath = path.join(predicatesDir, file);
        await fs.unlink(filePath);
        console.log(colors.yellow(`Removed ${file}`));
      }
    } else {
      console.log(colors.yellow(`Would remove ${fixPredicateFiles.length} fix predicate files`));
    }
    
  } catch (error) {
    console.error(colors.red(`Error cleaning up fix predicates: ${error.message}`));
  }
}

async function applyTopicUpdates() {
  console.log(colors.bold('\nApplying topic updates:'));
  
  // Find all topic update files
  const updateFiles = await findFilesWithPattern(fixesDir, '*-update.json');
  console.log(`Found ${updateFiles.length} topic update files`);
  
  let updatedTopics = 0;
  
  for (const updateFile of updateFiles) {
    const updateFilePath = path.join(fixesDir, updateFile);
    
    try {
      // Read update file
      const updateContent = await fs.readFile(updateFilePath, 'utf8');
      const update = JSON.parse(updateContent);
      
      // Extract topic ID and check if it's valid
      const topicId = update['@id'];
      if (!topicId) {
        console.warn(colors.yellow(`Warning: Update file ${updateFile} has no @id property, skipping`));
        continue;
      }
      
      // Find corresponding topic file
      const topicFileName = topicId.split(':').pop();
      const topicFiles = await findFilesWithPattern(path.join(contentDir, 'topics'), `*-${topicFileName}.json`);
      
      if (topicFiles.length === 0) {
        console.warn(colors.yellow(`Warning: No topic file found for ${topicId}`));
        continue;
      }
      
      const topicFilePath = path.join(contentDir, 'topics', topicFiles[0]);
      
      // Read existing topic file
      const topicContent = await fs.readFile(topicFilePath, 'utf8');
      const topic = JSON.parse(topicContent);
      
      // Get existing hasPart items
      const existingHasPart = Array.isArray(topic.hasPart) ? topic.hasPart : [];
      
      // Get new hasPart items to add
      const newHasPart = Array.isArray(update.hasPart) ? update.hasPart : [];
      
      // Merge hasPart, avoiding duplicates
      const existingIds = new Set();
      
      // Add existing IDs to set for duplicate checking
      for (const item of existingHasPart) {
        if (typeof item === 'string') {
          existingIds.add(item);
        } else if (item['@id']) {
          existingIds.add(item['@id']);
        }
      }
      
      // Add new items that aren't duplicates
      const itemsToAdd = [];
      for (const item of newHasPart) {
        const itemId = typeof item === 'string' ? item : item['@id'];
        if (itemId && !existingIds.has(itemId)) {
          itemsToAdd.push(item);
          existingIds.add(itemId);
        }
      }
      
      if (itemsToAdd.length === 0) {
        console.log(`No new items to add to ${topicFiles[0]}`);
        continue;
      }
      
      // Update the topic
      topic.hasPart = [...existingHasPart, ...itemsToAdd];
      topic.dateModified = new Date().toISOString();
      
      // Write back to file
      if (!options.dryRun) {
        await fs.writeFile(topicFilePath, JSON.stringify(topic, null, 2));
        console.log(colors.green(`Updated ${topicFiles[0]} with ${itemsToAdd.length} new items`));
      } else {
        console.log(colors.yellow(`Would update ${topicFiles[0]} with ${itemsToAdd.length} new items`));
      }
      
      updatedTopics++;
      
    } catch (error) {
      console.error(colors.red(`Error processing ${updateFile}: ${error.message}`));
      continue;
    }
  }
  
  console.log(colors.green(`Updated ${updatedTopics} topics`));
}

async function copyPredicateFixes() {
  console.log(colors.bold('\nCopying predicate fixes:'));
  
  // Find all predicate fix files
  const fixFiles = await findFilesWithPattern(fixesDir, 'fix-connect-*.json');
  console.log(`Found ${fixFiles.length} predicate fix files`);
  
  // Ensure predicates directory exists
  const predicatesDir = path.join(contentDir, 'predicates');
  if (!options.dryRun) {
    try {
      await fs.mkdir(predicatesDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  let copiedPredicates = 0;
  const predicateMap = new Map(); // Map from source file to target file
  
  for (const fixFile of fixFiles) {
    const fixFilePath = path.join(fixesDir, fixFile);
    
    try {
      // Read fix file
      const fixContent = await fs.readFile(fixFilePath, 'utf8');
      const fix = JSON.parse(fixContent);
      
      // Extract predicate ID and check if it's valid
      const predicateId = fix['@id'];
      if (!predicateId) {
        console.warn(colors.yellow(`Warning: Fix file ${fixFile} has no @id property, skipping`));
        continue;
      }
      
      // Determine target filename - just use fix name without adding redundant prefixes
      const targetFileName = fixFile.startsWith('fix-connect-') 
        ? `UOR-P-${fixFile}` 
        : `UOR-P-${fixFile}`;
      const targetFilePath = path.join(predicatesDir, targetFileName);
      
      // Check if target already exists
      try {
        await fs.access(targetFilePath);
        console.log(`Predicate file ${targetFileName} already exists, skipping`);
        predicateMap.set(fixFile, {
          targetFile: targetFileName,
          predicateId,
          fix
        });
        continue;
      } catch (error) {
        // File doesn't exist, proceed with copy
      }
      
      // Copy file to predicates directory
      if (!options.dryRun) {
        await fs.writeFile(targetFilePath, fixContent);
        console.log(colors.green(`Copied ${fixFile} to ${targetFileName}`));
      } else {
        console.log(colors.yellow(`Would copy ${fixFile} to ${targetFileName}`));
      }
      
      predicateMap.set(fixFile, {
        targetFile: targetFileName,
        predicateId,
        fix
      });
      
      copiedPredicates++;
      
    } catch (error) {
      console.error(colors.red(`Error processing ${fixFile}: ${error.message}`));
      continue;
    }
  }
  
  console.log(colors.green(`Copied ${copiedPredicates} predicate files`));
  return predicateMap;
}

async function updateTopicsWithFixPredicates(predicateMap) {
  console.log(colors.bold('\nUpdating topics with fix predicates:'));
  
  // Group predicates by target topic
  const topicPredicateMap = new Map();
  
  for (const [fixFile, data] of predicateMap.entries()) {
    const { fix } = data;
    
    // Extract target topic from the fix
    const targetTopics = Array.isArray(fix.targetCollection) ? fix.targetCollection : [];
    
    for (const topicId of targetTopics) {
      if (!topicPredicateMap.has(topicId)) {
        topicPredicateMap.set(topicId, []);
      }
      topicPredicateMap.get(topicId).push(fix['@id']);
    }
  }
  
  console.log(`Found ${topicPredicateMap.size} topics to update with predicates`);
  
  // Update each topic file
  let updatedTopics = 0;
  
  for (const [topicId, predicateIds] of topicPredicateMap.entries()) {
    // Find topic file
    const topicName = topicId.split(':').pop();
    const topicFiles = await findFilesWithPattern(path.join(contentDir, 'topics'), `*-${topicName}.json`);
    
    if (topicFiles.length === 0) {
      console.warn(colors.yellow(`Warning: No topic file found for ${topicId}`));
      continue;
    }
    
    const topicFilePath = path.join(contentDir, 'topics', topicFiles[0]);
    
    try {
      // Read topic file
      const topicContent = await fs.readFile(topicFilePath, 'utf8');
      const topic = JSON.parse(topicContent);
      
      // Get existing hasPart items
      const existingHasPart = Array.isArray(topic.hasPart) ? topic.hasPart : [];
      
      // Filter out existing predicate IDs
      const existingIds = new Set();
      for (const item of existingHasPart) {
        if (typeof item === 'string') {
          existingIds.add(item);
        } else if (item['@id']) {
          existingIds.add(item['@id']);
        }
      }
      
      // Add new predicates that aren't already in hasPart
      const newPredicates = predicateIds.filter(id => !existingIds.has(id));
      
      if (newPredicates.length === 0) {
        console.log(`No new predicates to add to ${topicFiles[0]}`);
        continue;
      }
      
      // Update the topic
      topic.hasPart = [...existingHasPart, ...newPredicates];
      topic.dateModified = new Date().toISOString();
      
      // Write back to file
      if (!options.dryRun) {
        await fs.writeFile(topicFilePath, JSON.stringify(topic, null, 2));
        console.log(colors.green(`Updated ${topicFiles[0]} with ${newPredicates.length} fix predicates`));
      } else {
        console.log(colors.yellow(`Would update ${topicFiles[0]} with ${newPredicates.length} fix predicates`));
      }
      
      updatedTopics++;
      
    } catch (error) {
      console.error(colors.red(`Error updating topic ${topicFiles[0]}: ${error.message}`));
      continue;
    }
  }
  
  console.log(colors.green(`Updated ${updatedTopics} topics with fix predicates`));
}

async function findFilesWithPattern(directory, pattern) {
  try {
    const files = await fs.readdir(directory);
    return files.filter(file => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(file);
    });
  } catch (error) {
    console.error(colors.red(`Error reading directory ${directory}: ${error.message}`));
    return [];
  }
}

// Run the main function
main();