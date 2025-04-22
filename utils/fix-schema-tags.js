/**
 * Fix Schema.org URI
 * 
 * Ensures all files have the correct schema.org URI in @context
 */

const fs = require('fs').promises;
const path = require('path');

async function fixSchemaTags(contentDir) {
  console.log(`Fixing schema tags in ${contentDir}...`);
  
  // Find all JSON files
  const files = await findJsonFiles(contentDir);
  console.log(`Found ${files.length} JSON files to check`);
  
  let fixedCount = 0;
  
  // Process each file
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const json = JSON.parse(content);
      
      let needsFix = false;
      
      // Check @context
      if (json['@context']) {
        // Fix string context that doesn't match https://schema.org
        if (typeof json['@context'] === 'string' && 
            json['@context'] !== 'https://schema.org') {
          json['@context'] = 'https://schema.org';
          needsFix = true;
        }
        // Fix object context that doesn't have @vocab: https://schema.org
        else if (typeof json['@context'] === 'object' && 
                !json['@context']['@vocab']) {
          json['@context']['@vocab'] = 'https://schema.org/';
          needsFix = true;
        }
      } else {
        // Add missing @context
        json['@context'] = 'https://schema.org';
        needsFix = true;
      }
      
      // Save the file if fixes were made
      if (needsFix) {
        await fs.writeFile(file, JSON.stringify(json, null, 2));
        fixedCount++;
        console.log(`Fixed ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  console.log(`Fixed ${fixedCount} files`);
}

// Find all JSON files
async function findJsonFiles(dir) {
  const results = [];
  
  async function scanDir(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  }
  
  await scanDir(dir);
  return results;
}

// Process command line arguments
if (require.main === module) {
  const contentDir = process.argv[2] || '../converted';
  
  fixSchemaTags(contentDir)
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixSchemaTags };