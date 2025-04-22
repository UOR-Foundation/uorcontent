#!/usr/bin/env node

/**
 * Index Generator
 * 
 * Creates index files for the converted content to enable efficient lookup
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Set up CLI options
program
  .name('generate-index')
  .description('Generate index files for content')
  .version('1.0.0')
  .option('-d, --directory <path>', 'Root directory containing converted content', '../converted')
  .option('-o, --output-dir <path>', 'Directory to write index files', '../converted/index')
  .parse(process.argv);

const options = program.opts();

// Main function
async function main() {
  try {
    const contentDir = path.resolve(__dirname, options.directory);
    const outputDir = path.resolve(__dirname, options.outputDir);
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate indices
    await generateConceptIndex(contentDir, outputDir);
    await generateTopicIndex(contentDir, outputDir);
    await generateResourceIndex(contentDir, outputDir);
    await generatePredicateIndex(contentDir, outputDir);
    
    console.log('Index generation completed successfully.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Generate index for concepts
async function generateConceptIndex(contentDir, outputDir) {
  const conceptsDir = path.join(contentDir, 'concepts');
  const conceptFiles = await readJsonFiles(conceptsDir);
  
  const index = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": conceptFiles.length,
    "itemListElement": []
  };
  
  for (let i = 0; i < conceptFiles.length; i++) {
    const concept = conceptFiles[i];
    index.itemListElement.push({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@id": concept["@id"] || `urn:concept:${i}`,
        "@type": concept["@type"],
        "name": concept.name,
        "description": concept.description,
        "termCode": concept.termCode
      }
    });
  }
  
  await writeJsonFile(path.join(outputDir, 'concepts.json'), index);
  console.log(`Generated concepts index with ${conceptFiles.length} items.`);
}

// Generate index for topics
async function generateTopicIndex(contentDir, outputDir) {
  const topicsDir = path.join(contentDir, 'topics');
  const topicFiles = await readJsonFiles(topicsDir);
  
  const index = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": topicFiles.length,
    "itemListElement": []
  };
  
  for (let i = 0; i < topicFiles.length; i++) {
    const topic = topicFiles[i];
    index.itemListElement.push({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@id": topic["@id"] || `urn:topic:${i}`,
        "@type": topic["@type"],
        "name": topic.name,
        "description": topic.description,
        "url": topic.potentialAction?.target?.urlTemplate
      }
    });
  }
  
  await writeJsonFile(path.join(outputDir, 'topics.json'), index);
  console.log(`Generated topics index with ${topicFiles.length} items.`);
}

// Generate index for resources
async function generateResourceIndex(contentDir, outputDir) {
  const resourcesDir = path.join(contentDir, 'resources');
  const resourceFiles = await readJsonFiles(resourcesDir);
  
  const index = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": resourceFiles.length,
    "itemListElement": []
  };
  
  for (let i = 0; i < resourceFiles.length; i++) {
    const resource = resourceFiles[i];
    index.itemListElement.push({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@id": resource["@id"] || `urn:resource:${i}`,
        "@type": resource["@type"],
        "name": resource.name,
        "description": resource.description,
        "about": resource.about?.name
      }
    });
  }
  
  await writeJsonFile(path.join(outputDir, 'resources.json'), index);
  console.log(`Generated resources index with ${resourceFiles.length} items.`);
}

// Generate index for predicates
async function generatePredicateIndex(contentDir, outputDir) {
  const predicatesDir = path.join(contentDir, 'predicates');
  const predicateFiles = await readJsonFiles(predicatesDir);
  
  const index = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": predicateFiles.length,
    "itemListElement": []
  };
  
  for (let i = 0; i < predicateFiles.length; i++) {
    const predicate = predicateFiles[i];
    index.itemListElement.push({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@id": predicate["@id"] || `urn:predicate:${i}`,
        "name": predicate.name,
        "subjectOf": predicate.subjectOf,
        "targetCollection": predicate.targetCollection,
        "valueName": predicate.valueName
      }
    });
  }
  
  await writeJsonFile(path.join(outputDir, 'predicates.json'), index);
  console.log(`Generated predicates index with ${predicateFiles.length} items.`);
}

// Helper function to read all JSON files from a directory
async function readJsonFiles(directory) {
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    const jsonFiles = files.filter(file => file.isFile() && file.name.endsWith('.json'));
    
    const contents = [];
    for (const file of jsonFiles) {
      const filePath = path.join(directory, file.name);
      const content = await fs.readFile(filePath, 'utf8');
      try {
        const json = JSON.parse(content);
        contents.push(json);
      } catch (error) {
        console.warn(`Warning: Skipping ${filePath} - invalid JSON`);
      }
    }
    return contents;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Warning: Directory ${directory} does not exist`);
      return [];
    }
    throw error;
  }
}

// Helper function to write JSON file
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Run main function
main();
