/**
 * Fix Object References
 * 
 * Fixes object reference issues in topic files where hasPart elements contain [object Object]
 * and other object serialization issues
 */

const fs = require('fs').promises;
const path = require('path');

async function fixObjectReferences(contentDir) {
  console.log(`Fixing object references in ${contentDir}...`);
  
  // Find all topic files
  const topicFiles = await findTopicFiles(contentDir);
  console.log(`Found ${topicFiles.length} topic files`);
  
  let fixedCount = 0;
  
  // Process each topic file
  for (const file of topicFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Check for [object Object] in the string content
      if (content.includes('[object Object]')) {
        console.log(`Found [object Object] in ${file}`);
        
        // Parse the JSON
        const json = JSON.parse(content);
        
        // Check hasPart array
        if (json.hasPart && Array.isArray(json.hasPart)) {
          let needsFix = false;
          
          // Look for any entries with [object Object] as @id
          for (let i = 0; i < json.hasPart.length; i++) {
            const part = json.hasPart[i];
            
            if (part['@id'] === '[object Object]' || 
                String(part['@id']).includes('[object Object]')) {
              
              // Create a proper ID from the name
              if (part.name) {
                const idSuffix = part.name.toLowerCase().replace(/\s+/g, '-');
                json.hasPart[i]['@id'] = `urn:uor:resource:${idSuffix}`;
                needsFix = true;
              }
            }
          }
          
          // Save the file if fixes were made
          if (needsFix) {
            await fs.writeFile(file, JSON.stringify(json, null, 2));
            fixedCount++;
            console.log(`Fixed and saved ${file}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  console.log(`Fixed ${fixedCount} topic files`);
}

// Find all topic files
async function findTopicFiles(contentDir) {
  const topicsDir = path.join(contentDir, 'topics');
  const files = [];
  
  async function scanDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDirectory(topicsDir);
  return files;
}

// Process command line arguments
if (require.main === module) {
  const contentDir = process.argv[2] || '../converted';
  
  fixObjectReferences(contentDir)
    .catch(error => {
      console.error(`Error fixing object references: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixObjectReferences };