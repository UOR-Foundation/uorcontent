#!/usr/bin/env node

/**
 * Fix topic warnings script
 * 
 * Addresses warnings in topic files, specifically:
 * - Missing urlTemplate in potentialAction.target
 * - Invalid hasPart references
 * - Invalid isPartOf references
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function fixTopicWarnings(directory) {
  // Find all topic files
  const topicDir = path.resolve(directory, 'topics');
  const topicFiles = glob.sync(path.join(topicDir, '**/*.json'));
  
  console.log(`Found ${topicFiles.length} topic files to check`);
  
  let fixedFiles = 0;
  let errorFiles = 0;
  
  // Process each file
  for (const filePath of topicFiles) {
    try {
      // Read and parse the file
      const content = await fs.readFile(filePath, 'utf8');
      const topic = JSON.parse(content);
      
      let modified = false;
      
      // Check for missing urlTemplate in potentialAction.target
      if (!topic.potentialAction?.target?.urlTemplate) {
        // Extract name for the URL
        const topicName = topic.name.toLowerCase().replace(/\s+/g, '-');
        
        // Add potentialAction with urlTemplate
        topic.potentialAction = topic.potentialAction || {};
        topic.potentialAction.target = topic.potentialAction.target || {};
        topic.potentialAction.target.urlTemplate = `/topics/${topicName}`;
        
        console.log(`Fixed missing urlTemplate in ${path.basename(filePath)}`);
        modified = true;
      }
      
      // Check for and fix hasPart references
      if (topic.hasPart && topic.hasPart.length > 0) {
        const fixedParts = [];
        
        for (const part of topic.hasPart) {
          if (typeof part === 'string') {
            // String reference is correct format, keep as is
            fixedParts.push(part);
          } else if (typeof part === 'object') {
            // For object references, ensure they have a valid @id
            if (part['@id'] && typeof part['@id'] === 'string') {
              // Valid object reference, keep as is
              fixedParts.push(part);
            } else if (part.identifier || part.name) {
              // Try to create a valid reference from existing properties
              const newPart = { '@id': part.identifier || `urn:${part.name.toLowerCase().replace(/\s+/g, '-')}` };
              fixedParts.push(newPart);
              console.log(`Fixed invalid hasPart reference in ${path.basename(filePath)}`);
              modified = true;
            } else {
              // Can't fix, remove invalid reference
              console.log(`Removed invalid hasPart reference in ${path.basename(filePath)}`);
              modified = true;
              // Don't add to fixedParts
            }
          }
        }
        
        if (topic.hasPart.length !== fixedParts.length) {
          topic.hasPart = fixedParts;
          modified = true;
        }
      }
      
      // Check for invalid isPartOf reference
      if (topic.isPartOf && topic.isPartOf['@id'] && typeof topic.isPartOf['@id'] !== 'string') {
        if (typeof topic.isPartOf['@id'] === 'object') {
          // Try to fix object reference
          if (topic.isPartOf['@id'].identifier) {
            topic.isPartOf['@id'] = topic.isPartOf['@id'].identifier;
            console.log(`Fixed invalid isPartOf reference in ${path.basename(filePath)}`);
            modified = true;
          } else {
            // Can't fix, remove invalid reference
            delete topic.isPartOf;
            console.log(`Removed invalid isPartOf reference in ${path.basename(filePath)}`);
            modified = true;
          }
        }
      }
      
      // Write back if modified
      if (modified) {
        await fs.writeFile(filePath, JSON.stringify(topic, null, 2), 'utf8');
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
  console.log(`- Total files processed: ${topicFiles.length}`);
}

// Main execution
if (require.main === module) {
  const directory = process.argv[2] || path.resolve(__dirname, '../converted');
  
  if (!directory) {
    console.error('Usage: node fix-topic-warnings.js [directory]');
    process.exit(1);
  }
  
  fixTopicWarnings(directory)
    .then(() => {
      console.log('Completed fixing topic warnings');
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixTopicWarnings };