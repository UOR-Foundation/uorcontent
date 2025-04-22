/**
 * Find Object References
 * 
 * Finds files with [object Object] references
 */

const fs = require('fs').promises;
const path = require('path');

async function findObjectReferences(contentDir) {
  console.log(`Searching for object references in ${contentDir}...`);
  
  // Find all JSON files
  const files = await findJsonFiles(contentDir);
  console.log(`Found ${files.length} JSON files to check`);
  
  let foundCount = 0;
  
  // Check each file
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Check for [object Object] in the string
      if (content.includes('[object Object]')) {
        console.log(`Found [object Object] in ${file}`);
        foundCount++;
      }
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }
  
  if (foundCount === 0) {
    console.log('No files with [object Object] found');
  } else {
    console.log(`Found ${foundCount} files with [object Object] references`);
  }
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
  
  findObjectReferences(contentDir)
    .catch(error => {
      console.error(`Error finding object references: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { findObjectReferences };