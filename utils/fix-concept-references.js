/**
 * Fix Concept References
 * 
 * Creates missing concept files for referenced concepts that don't exist
 */

const fs = require('fs').promises;
const path = require('path');

async function fixConceptReferences(contentDir) {
  console.log(`Fixing concept references in ${contentDir}...`);
  
  // Build a map of existing concepts
  const conceptMap = await buildConceptMap(contentDir);
  console.log(`Found ${Object.keys(conceptMap).length} existing concepts`);
  
  // Find all files with relatedConcepts or that reference concepts
  const [conceptsWithReferences, allReferencedConcepts] = await findConceptReferences(contentDir);
  
  console.log(`Found ${Object.keys(conceptsWithReferences).length} files with concept references`);
  console.log(`Found ${allReferencedConcepts.size} unique referenced concept IDs`);
  
  // Identify missing concepts
  const missingConcepts = Array.from(allReferencedConcepts)
    .filter(id => !conceptMap[id]);
  
  console.log(`Identified ${missingConcepts.length} missing concepts`);
  
  // Create missing concept files
  let createdCount = 0;
  for (const id of missingConcepts) {
    try {
      // Extract name from ID
      const name = extractNameFromId(id);
      if (!name) {
        console.warn(`Could not extract name from ID: ${id}`);
        continue;
      }
      
      // Generate a termCode
      const termCode = `UOR-C-${300 + createdCount}`;
      
      // Create concept file
      const concept = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": id,
        "name": formatName(name),
        "description": `${formatName(name)} is a concept in the Universal Object Reference framework.`,
        "termCode": termCode,
        "dateCreated": new Date().toISOString(),
        "dateModified": new Date().toISOString()
      };
      
      // Determine filename
      const fileName = `${termCode}-${name}.json`;
      const filePath = path.join(contentDir, 'concepts', fileName);
      
      // Write the file
      await fs.writeFile(filePath, JSON.stringify(concept, null, 2));
      createdCount++;
      
      console.log(`Created concept file: ${filePath}`);
      
      // Add to concept map
      conceptMap[id] = {
        path: filePath,
        name: concept.name
      };
    } catch (error) {
      console.error(`Error creating concept for ${id}: ${error.message}`);
    }
  }
  
  console.log(`Created ${createdCount} new concept files`);
  
  // Update the index
  try {
    const indexPath = path.join(contentDir, 'index.json');
    const conceptsIndexPath = path.join(contentDir, 'concepts-index.json');
    
    // Update main index
    await updateMainIndex(indexPath, conceptMap);
    
    // Update concepts index
    await updateConceptsIndex(conceptsIndexPath, conceptMap);
    
    console.log(`Updated index files`);
  } catch (error) {
    console.error(`Error updating index: ${error.message}`);
  }
}

// Build a map of existing concepts
async function buildConceptMap(contentDir) {
  const conceptsDir = path.join(contentDir, 'concepts');
  const map = {};
  
  try {
    const entries = await fs.readdir(conceptsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = path.join(conceptsDir, entry.name);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const json = JSON.parse(content);
          
          if (json['@id'] && json['@type'] === 'DefinedTerm') {
            map[json['@id']] = {
              path: filePath,
              name: json.name
            };
          }
        } catch (error) {
          console.error(`Error reading concept file ${filePath}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading concepts directory: ${error.message}`);
  }
  
  return map;
}

// Find all files with relatedConcepts
async function findConceptReferences(contentDir) {
  const conceptsWithReferences = {};
  const allReferencedConcepts = new Set();
  
  // Process directory recursively
  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const content = await fs.readFile(entryPath, 'utf8');
          const json = JSON.parse(content);
          
          // Check for relatedConcepts array
          if (json.relatedConcepts && Array.isArray(json.relatedConcepts)) {
            conceptsWithReferences[entryPath] = json.relatedConcepts;
            
            // Add each referenced concept to the set
            for (const conceptId of json.relatedConcepts) {
              if (conceptId && typeof conceptId === 'string' && conceptId.startsWith('urn:uor:concept:')) {
                allReferencedConcepts.add(conceptId);
              }
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
  }
  
  await processDirectory(contentDir);
  return [conceptsWithReferences, allReferencedConcepts];
}

// Extract name from ID
function extractNameFromId(id) {
  if (!id || typeof id !== 'string') return null;
  
  // Extract the last part of the URN
  const match = id.match(/urn:uor:concept:(.+)$/);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

// Format name with proper capitalization
function formatName(name) {
  if (!name) return '';
  
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Update main index file
async function updateMainIndex(indexPath, conceptMap) {
  try {
    const content = await fs.readFile(indexPath, 'utf8');
    const index = JSON.parse(content);
    
    // Get the current items
    const existingIds = new Set(
      index.itemListElement.map(item => item.item['@id'])
    );
    
    // Add new concepts
    let position = index.numberOfItems;
    
    for (const [id, concept] of Object.entries(conceptMap)) {
      if (!existingIds.has(id)) {
        position++;
        index.itemListElement.push({
          "@type": "ListItem",
          "position": position,
          "item": {
            "@id": id,
            "@type": "DefinedTerm",
            "name": concept.name
          }
        });
      }
    }
    
    // Update the count
    index.numberOfItems = position;
    
    // Write back
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error(`Error updating main index: ${error.message}`);
  }
}

// Update concepts index file
async function updateConceptsIndex(indexPath, conceptMap) {
  try {
    const content = await fs.readFile(indexPath, 'utf8');
    const index = JSON.parse(content);
    
    // Get the current items
    const existingIds = new Set(
      index.itemListElement.map(item => item.item['@id'])
    );
    
    // Add new concepts
    let position = index.numberOfItems;
    
    for (const [id, concept] of Object.entries(conceptMap)) {
      if (!existingIds.has(id)) {
        position++;
        index.itemListElement.push({
          "@type": "ListItem",
          "position": position,
          "item": {
            "@id": id,
            "@type": "DefinedTerm",
            "name": concept.name
          }
        });
      }
    }
    
    // Update the count
    index.numberOfItems = position;
    
    // Write back
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error(`Error updating concepts index: ${error.message}`);
  }
}

// Process any command line arguments
if (require.main === module) {
  const contentDir = process.argv[2] || '../converted';
  
  fixConceptReferences(contentDir)
    .catch(error => {
      console.error(`Error fixing concept references: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixConceptReferences };