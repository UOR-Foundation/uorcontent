/**
 * Fix Topic References
 * 
 * Fixes hasPart references in topic files that were incorrectly serialized as [object Object]
 */

const fs = require('fs').promises;
const path = require('path');

async function fixTopicReferences(contentDir) {
  console.log(`Fixing topic references in ${contentDir}...`);
  
  // Find all topic files
  const topicFiles = await findTopicFiles(contentDir);
  console.log(`Found ${topicFiles.length} topic files`);
  
  let fixedCount = 0;
  
  // Process each topic file
  for (const file of topicFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const json = JSON.parse(content);
      
      // Check if this file has hasPart references
      if (json.hasPart && Array.isArray(json.hasPart)) {
        let needsFix = false;
        
        // Check each hasPart reference
        for (let i = 0; i < json.hasPart.length; i++) {
          const part = json.hasPart[i];
          
          // Check if the @id is incorrectly serialized as [object Object]
          if (part['@id'] && (
              part['@id'] === '[object Object]' || 
              typeof part['@id'] === 'object')) {
            
            // Extract the correct ID from the name
            const name = part.name;
            if (name) {
              // Generate a proper ID from the name
              const id = `urn:uor:resource:${name.toLowerCase().replace(/\s+/g, '-')}`;
              json.hasPart[i]['@id'] = id;
              needsFix = true;
              console.log(`Fixed reference in ${file}: "${name}" -> "${id}"`);
            }
          }
        }
        
        // Save the file if fixes were applied
        if (needsFix) {
          await fs.writeFile(file, JSON.stringify(json, null, 2));
          fixedCount++;
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  console.log(`Fixed ${fixedCount} topic files`);
}

// Recursive function to find all topic files
async function findTopicFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subResults = await findTopicFiles(entryPath);
      results.push(...subResults);
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name.startsWith('UOR-T-')) {
      results.push(entryPath);
    }
  }
  
  return results;
}

// Process any command line arguments
if (require.main === module) {
  const contentDir = process.argv[2] || '../converted';
  
  fixTopicReferences(contentDir)
    .catch(error => {
      console.error(`Error fixing topic references: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixTopicReferences };