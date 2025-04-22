/**
 * Build Index for UOR Content
 * 
 * Creates a schema.org compliant index from the converted content
 */

const fs = require('fs').promises;
const path = require('path');

async function buildIndex(contentDir, outputPath) {
  console.log(`Building index from ${contentDir} to ${outputPath}...`);
  
  // Initialize collections
  const allItems = [];
  const conceptItems = [];
  const resourceItems = [];
  const topicItems = [];
  const predicateItems = [];
  
  // Process all content recursively
  await processDirectory(contentDir);
  
  // Create index
  const index = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "UOR Content Index",
    "description": "Index of all UOR content items",
    "numberOfItems": allItems.length,
    "itemListElement": allItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@id": item["@id"],
        "@type": item["@type"], 
        "name": item.name
      }
    }))
  };
  
  // Create specialized indexes
  const conceptsIndex = createSpecializedIndex('Concepts', conceptItems);
  const resourcesIndex = createSpecializedIndex('Resources', resourceItems);
  const topicsIndex = createSpecializedIndex('Topics', topicItems);
  const predicatesIndex = createSpecializedIndex('Predicates', predicateItems);
  
  // Write index files
  await fs.writeFile(outputPath, JSON.stringify(index, null, 2));
  await fs.writeFile(path.join(path.dirname(outputPath), 'concepts-index.json'), JSON.stringify(conceptsIndex, null, 2));
  await fs.writeFile(path.join(path.dirname(outputPath), 'resources-index.json'), JSON.stringify(resourcesIndex, null, 2));
  await fs.writeFile(path.join(path.dirname(outputPath), 'topics-index.json'), JSON.stringify(topicsIndex, null, 2));
  await fs.writeFile(path.join(path.dirname(outputPath), 'predicates-index.json'), JSON.stringify(predicatesIndex, null, 2));
  
  console.log(`Index built with ${allItems.length} items (${conceptItems.length} concepts, ${resourceItems.length} resources, ${topicItems.length} topics, ${predicateItems.length} predicates)`);
  
  // Recursive function to process directories
  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('index')) {
        try {
          const content = await fs.readFile(entryPath, 'utf8');
          const json = JSON.parse(content);
          
          if (json['@id']) {
            // Extract minimal data for the index
            const indexItem = {
              "@id": json['@id'],
              "@type": json['@type'],
              "name": json.name
            };
            
            allItems.push(indexItem);
            
            // Categorize by type
            if (json['@type'] === 'DefinedTerm') {
              conceptItems.push(indexItem);
            } else if (json['@type'] === 'PropertyValue') {
              predicateItems.push(indexItem);
            } else if (json['@type'] === 'CreativeWork') {
              if (json.learningResourceType === 'Topic') {
                topicItems.push(indexItem);
              } else {
                resourceItems.push(indexItem);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing ${entryPath}: ${error.message}`);
        }
      }
    }
  }
  
  // Create specialized index
  function createSpecializedIndex(name, items) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `UOR ${name} Index`,
      "description": `Index of all UOR ${name.toLowerCase()}`,
      "numberOfItems": items.length,
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@id": item["@id"],
          "@type": item["@type"],
          "name": item.name
        }
      }))
    };
  }
}

// Process any command line arguments
if (require.main === module) {
  const contentDir = process.argv[2] || '../converted';
  const outputPath = process.argv[3] || '../converted/index.json';
  
  buildIndex(contentDir, outputPath)
    .catch(error => {
      console.error(`Error building index: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { buildIndex };