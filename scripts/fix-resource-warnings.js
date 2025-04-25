#!/usr/bin/env node

/**
 * Fix resource warnings script
 * 
 * Addresses warnings in resource files, specifically:
 * - Missing text content or child parts
 * - Invalid hasPart references
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function fixResourceWarnings(directory) {
  // Find all resource files
  const resourceDir = path.resolve(directory, 'resources');
  const resourceFiles = glob.sync(path.join(resourceDir, '**/*.json'));
  
  console.log(`Found ${resourceFiles.length} resource files to check`);
  
  let fixedFiles = 0;
  let errorFiles = 0;
  
  // Process each file
  for (const filePath of resourceFiles) {
    try {
      // Read and parse the file
      const content = await fs.readFile(filePath, 'utf8');
      const resource = JSON.parse(content);
      
      let modified = false;
      
      // Fix missing text content if applicable
      if ((resource['@type'] === 'InformationResource' || resource['@type'] === 'CreativeWork') && 
          !resource.text && !resource.hasPart?.length) {
        
        // Add placeholder text if missing
        resource.text = resource.text || `Content for ${resource.name}`;
        modified = true;
        console.log(`Fixed missing text in ${path.basename(filePath)}`);
      }
      
      // Check for and fix hasPart references
      if (resource.hasPart && resource.hasPart.length > 0) {
        const fixedParts = [];
        
        for (const part of resource.hasPart) {
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
        
        if (resource.hasPart.length !== fixedParts.length) {
          resource.hasPart = fixedParts;
          modified = true;
        }
      }
      
      // Write back if modified
      if (modified) {
        await fs.writeFile(filePath, JSON.stringify(resource, null, 2), 'utf8');
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
  console.log(`- Total files processed: ${resourceFiles.length}`);
}

// Main execution
if (require.main === module) {
  const directory = process.argv[2] || path.resolve(__dirname, '../converted');
  
  if (!directory) {
    console.error('Usage: node fix-resource-warnings.js [directory]');
    process.exit(1);
  }
  
  fixResourceWarnings(directory)
    .then(() => {
      console.log('Completed fixing resource warnings');
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixResourceWarnings };