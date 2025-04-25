#!/usr/bin/env node

/**
 * UOR Framework Content Connectivity Validator
 * 
 * This script validates that all UOR Framework content (concepts, resources, predicates)
 * is properly connected through the topic hierarchy to ensure complete navigability.
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
  .name('fix-content-connectivity')
  .description('Fixes disconnected content in the UOR Framework by creating necessary connection files')
  .version('1.0.0')
  .option('-d, --directory <path>', 'Path to the converted content directory', './content/converted')
  .option('-v, --verbose', 'Display detailed validation information', false)
  .option('-o, --output <path>', 'Directory to write fix files to', './content/fixes')
  .option('--dry-run', 'Show fixes without writing files', false)
  .parse(process.argv);

const options = program.opts();
const contentDir = path.resolve(options.directory);

// Main validation function
async function main() {
  try {
    console.log(colors.bold('UOR Framework Content Connectivity Fixer'));
    console.log(`Processing content in: ${contentDir}\n`);

    // Check if content directory exists
    try {
      await fs.access(contentDir);
    } catch (error) {
      console.error(colors.red(`Error: Content directory not found: ${contentDir}`));
      console.error(colors.yellow('Make sure to run the script with a valid --directory option'));
      process.exit(1);
    }

    // If output directory is specified and not in dry run mode, ensure it exists
    const outputDir = options.output ? path.resolve(options.output) : null;
    if (outputDir && !options.dryRun) {
      try {
        await fs.mkdir(outputDir, { recursive: true });
        console.log(colors.green(`Created output directory: ${outputDir}`));
      } catch (error) {
        console.error(colors.red(`Error creating output directory: ${error.message}`));
        process.exit(1);
      }
    }

    // Load all content and build connectivity graph
    const contentGraph = await buildContentGraph();
    
    // Validate connectivity
    const validationResults = validateConnectivity(contentGraph);
    
    // Display results
    displayResults(validationResults, contentGraph);
    
    // Generate and save fixes
    if (validationResults.disconnectedItems.length > 0) {
      await generateFixes(validationResults.disconnectedItems, contentGraph, outputDir, options.dryRun);
    } else {
      console.log(colors.green('\nNo disconnected items found! No fixes needed.'));
    }
    
    // Exit with appropriate code
    process.exit(validationResults.fullyConnected ? 0 : 1);
    
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Loads all content files and builds a graph of connections
 */
async function buildContentGraph() {
  console.log(colors.cyan('Building content graph...'));
  
  const graph = {
    topics: new Map(),     // Map of topic ID to topic object
    concepts: new Map(),   // Map of concept ID to concept object
    resources: new Map(),  // Map of resource ID to resource object
    predicates: new Map(), // Map of predicate ID to predicate object
    
    // Track connections
    topicConnections: new Map(), // Map of topic ID to set of connected item IDs
    itemConnections: new Map(),  // Map of item ID to set of connected topic IDs
    
    // Track orphaned items
    orphanedItems: new Set()     // Set of item IDs not connected to any topic
  };
  
  // Load topics first
  await loadTopics(graph);
  
  // Load concepts, resources, and predicates
  await loadConcepts(graph);
  await loadResources(graph);
  await loadPredicates(graph);
  
  // Process all predicates to build connections
  buildConnections(graph);
  
  return graph;
}

/**
 * Load all topics from the topics directory
 */
async function loadTopics(graph) {
  const topicsDir = path.join(contentDir, 'topics');
  const topicsIndexPath = path.join(contentDir, 'topics-index.json');
  
  try {
    // Load topics index as the starting point
    try {
      const topicsIndexContent = await fs.readFile(topicsIndexPath, 'utf8');
      const topicsIndex = JSON.parse(topicsIndexContent);
      
      if (topicsIndex.itemListElement && Array.isArray(topicsIndex.itemListElement)) {
        for (const entry of topicsIndex.itemListElement) {
          const topicId = entry.item['@id'];
          graph.topics.set(topicId, {
            id: topicId,
            name: entry.item.name,
            hasParts: new Set(),
            fromIndex: true
          });
          
          // Initialize connection tracking for this topic
          graph.topicConnections.set(topicId, new Set());
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn(colors.yellow(`Warning: Failed to read topics index: ${e.message}`));
    }
    
    // Load individual topic files if the directory exists
    try {
      const topicFiles = await fs.readdir(topicsDir);
      
      for (const file of topicFiles) {
        if (!file.endsWith('.json')) continue;
        
        const topicPath = path.join(topicsDir, file);
        const topicContent = await fs.readFile(topicPath, 'utf8');
        const topic = JSON.parse(topicContent);
        
        const topicId = topic['@id'];
        const existingTopic = graph.topics.get(topicId);
        
        // Create or update topic in the graph
        const topicObj = {
          id: topicId,
          name: topic.name,
          hasParts: new Set(Array.isArray(topic.hasPart) 
            ? topic.hasPart.map(part => typeof part === 'string' ? part : part['@id']) 
            : []),
          fromIndex: existingTopic ? existingTopic.fromIndex : false
        };
        
        graph.topics.set(topicId, topicObj);
        
        // Initialize connection tracking if not already done
        if (!graph.topicConnections.has(topicId)) {
          graph.topicConnections.set(topicId, new Set());
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn(colors.yellow(`Warning: Failed to read topics directory: ${e.message}`));
    }
    
    console.log(colors.green(`Loaded ${graph.topics.size} topics`));
    
  } catch (error) {
    console.error(colors.red(`Error loading topics: ${error.message}`));
    throw error;
  }
}

/**
 * Load all concepts from the concepts directory
 */
async function loadConcepts(graph) {
  const conceptsDir = path.join(contentDir, 'concepts');
  
  try {
    try {
      const conceptFiles = await fs.readdir(conceptsDir);
      
      for (const file of conceptFiles) {
        if (!file.endsWith('.json')) continue;
        
        const conceptPath = path.join(conceptsDir, file);
        const conceptContent = await fs.readFile(conceptPath, 'utf8');
        const concept = JSON.parse(conceptContent);
        
        const conceptId = concept['@id'];
        graph.concepts.set(conceptId, {
          id: conceptId,
          name: concept.name,
          termCode: concept.termCode,
          relatedConcepts: concept.relatedConcepts || []
        });
        
        // Initialize connection tracking for this concept
        graph.itemConnections.set(conceptId, new Set());
        
        // Mark as potentially orphaned until we find connections
        graph.orphanedItems.add(conceptId);
      }
      
      console.log(colors.green(`Loaded ${graph.concepts.size} concepts`));
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(colors.red(`Error reading concepts directory: ${e.message}`));
      } else {
        console.warn(colors.yellow(`Warning: Concepts directory not found at ${conceptsDir}`));
      }
    }
    
  } catch (error) {
    console.error(colors.red(`Error loading concepts: ${error.message}`));
    throw error;
  }
}

/**
 * Load all resources from the resources directory
 */
async function loadResources(graph) {
  const resourcesDir = path.join(contentDir, 'resources');
  
  try {
    try {
      const resourceFiles = await fs.readdir(resourcesDir);
      
      for (const file of resourceFiles) {
        if (!file.endsWith('.json')) continue;
        
        const resourcePath = path.join(resourcesDir, file);
        const resourceContent = await fs.readFile(resourcePath, 'utf8');
        const resource = JSON.parse(resourceContent);
        
        const resourceId = resource['@id'];
        graph.resources.set(resourceId, {
          id: resourceId,
          name: resource.name,
          isPartOf: resource.isPartOf ? (resource.isPartOf['@id'] || resource.isPartOf) : null
        });
        
        // Initialize connection tracking for this resource
        graph.itemConnections.set(resourceId, new Set());
        
        // Mark as potentially orphaned until we find connections
        graph.orphanedItems.add(resourceId);
      }
      
      console.log(colors.green(`Loaded ${graph.resources.size} resources`));
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(colors.red(`Error reading resources directory: ${e.message}`));
      } else {
        console.warn(colors.yellow(`Warning: Resources directory not found at ${resourcesDir}`));
      }
    }
    
  } catch (error) {
    console.error(colors.red(`Error loading resources: ${error.message}`));
    throw error;
  }
}

/**
 * Load all predicates from the predicates directory
 */
async function loadPredicates(graph) {
  const predicatesDir = path.join(contentDir, 'predicates');
  
  try {
    try {
      const predicateFiles = await fs.readdir(predicatesDir);
      
      for (const file of predicateFiles) {
        if (!file.endsWith('.json')) continue;
        
        const predicatePath = path.join(predicatesDir, file);
        const predicateContent = await fs.readFile(predicatePath, 'utf8');
        const predicate = JSON.parse(predicateContent);
        
        const predicateId = predicate['@id'];
        const subjectId = predicate.subjectOf ? (predicate.subjectOf['@id'] || predicate.subjectOf) : null;
        const targets = Array.isArray(predicate.targetCollection) 
          ? predicate.targetCollection.map(t => typeof t === 'string' ? t : t['@id'])
          : [];
        
        graph.predicates.set(predicateId, {
          id: predicateId,
          name: predicate.name,
          value: predicate.value,
          subjectOf: subjectId,
          targetCollection: targets
        });
        
        // Initialize connection tracking for this predicate
        graph.itemConnections.set(predicateId, new Set());
        
        // Mark as potentially orphaned until we find connections
        graph.orphanedItems.add(predicateId);
      }
      
      console.log(colors.green(`Loaded ${graph.predicates.size} predicates`));
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(colors.red(`Error reading predicates directory: ${e.message}`));
      } else {
        console.warn(colors.yellow(`Warning: Predicates directory not found at ${predicatesDir}`));
      }
    }
    
  } catch (error) {
    console.error(colors.red(`Error loading predicates: ${error.message}`));
    throw error;
  }
}

/**
 * Build connections between topics and items based on predicates
 */
function buildConnections(graph) {
  console.log(colors.cyan('Building content connections...'));
  
  // First, process direct topic memberships (hasPart)
  for (const [topicId, topic] of graph.topics.entries()) {
    for (const itemId of topic.hasParts) {
      // Add connection: topic -> item
      graph.topicConnections.get(topicId).add(itemId);
      
      // Add connection: item -> topic
      if (graph.itemConnections.has(itemId)) {
        graph.itemConnections.get(itemId).add(topicId);
        
        // Remove from orphaned items
        graph.orphanedItems.delete(itemId);
      }
    }
  }
  
  // Then, process predicates to find additional connections
  for (const [predicateId, predicate] of graph.predicates.entries()) {
    const subjectId = predicate.subjectOf;
    
    // Connect predicates to their subjects
    if (subjectId) {
      // Check if the subject has topic connections
      if (graph.itemConnections.has(subjectId) && graph.itemConnections.get(subjectId).size > 0) {
        // Inherit topic connections from subject
        const subjectTopics = graph.itemConnections.get(subjectId);
        
        for (const topicId of subjectTopics) {
          // Add connection: predicate -> topic
          graph.itemConnections.get(predicateId).add(topicId);
          
          // Add connection: topic -> predicate
          graph.topicConnections.get(topicId).add(predicateId);
        }
        
        // No longer orphaned
        graph.orphanedItems.delete(predicateId);
      }
    }
    
    // Connect targets to topics through predicates
    for (const targetId of predicate.targetCollection) {
      if (graph.itemConnections.has(targetId) && graph.itemConnections.get(subjectId)?.size > 0) {
        // Inherit topic connections
        const subjectTopics = graph.itemConnections.get(subjectId);
        
        for (const topicId of subjectTopics) {
          // Add connection: target -> topic
          if (graph.itemConnections.has(targetId)) {
            graph.itemConnections.get(targetId).add(topicId);
          }
          
          // Add connection: topic -> target
          graph.topicConnections.get(topicId).add(targetId);
        }
        
        // No longer orphaned
        graph.orphanedItems.delete(targetId);
      }
    }
  }
  
  // Process direct isPartOf links for resources
  for (const [resourceId, resource] of graph.resources.entries()) {
    if (resource.isPartOf && graph.topics.has(resource.isPartOf)) {
      const topicId = resource.isPartOf;
      
      // Add connection: resource -> topic
      graph.itemConnections.get(resourceId).add(topicId);
      
      // Add connection: topic -> resource
      graph.topicConnections.get(topicId).add(resourceId);
      
      // No longer orphaned
      graph.orphanedItems.delete(resourceId);
    }
  }
  
  // Iteratively propagate connections to ensure transitive closure
  // This ensures that items connected through other items also get connected to topics
  let changes = true;
  const maxIterations = 5; // Prevent infinite loops
  let iteration = 0;
  
  while (changes && iteration < maxIterations) {
    iteration++;
    changes = false;
    
    // For each item with no topic connections, check if it's connected to other items
    for (const itemId of graph.orphanedItems) {
      // Skip if it doesn't have connections tracking
      if (!graph.itemConnections.has(itemId)) continue;
      
      // Check if it's a concept with related concepts
      if (graph.concepts.has(itemId)) {
        const concept = graph.concepts.get(itemId);
        
        for (const relatedId of concept.relatedConcepts) {
          // If the related concept has topic connections, inherit them
          if (graph.itemConnections.has(relatedId) && graph.itemConnections.get(relatedId).size > 0) {
            const relatedTopics = graph.itemConnections.get(relatedId);
            
            for (const topicId of relatedTopics) {
              // Add connection: concept -> topic
              graph.itemConnections.get(itemId).add(topicId);
              
              // Add connection: topic -> concept
              graph.topicConnections.get(topicId).add(itemId);
              
              changes = true;
            }
          }
        }
      }
      
      // Check if this item has gained topic connections
      if (graph.itemConnections.get(itemId).size > 0) {
        graph.orphanedItems.delete(itemId);
        changes = true;
      }
    }
  }
}

/**
 * Validate the connectivity of the content graph
 */
function validateConnectivity(graph) {
  console.log(colors.cyan('Validating content connectivity...'));
  
  const results = {
    fullyConnected: graph.orphanedItems.size === 0,
    totalItems: graph.concepts.size + graph.resources.size + graph.predicates.size,
    connectedItems: 0,
    disconnectedItems: [],
    topicStats: new Map() // Map of topic ID to number of connected items
  };
  
  // Count connected items
  results.connectedItems = results.totalItems - graph.orphanedItems.size;
  
  // Get details of disconnected items
  for (const itemId of graph.orphanedItems) {
    let itemType = 'unknown';
    let name = 'unknown';
    
    if (graph.concepts.has(itemId)) {
      itemType = 'concept';
      name = graph.concepts.get(itemId).name;
    } else if (graph.resources.has(itemId)) {
      itemType = 'resource';
      name = graph.resources.get(itemId).name;
    } else if (graph.predicates.has(itemId)) {
      itemType = 'predicate';
      name = graph.predicates.get(itemId).name;
    }
    
    results.disconnectedItems.push({
      id: itemId,
      type: itemType,
      name: name
    });
  }
  
  // Calculate topic connection statistics
  for (const [topicId, connections] of graph.topicConnections.entries()) {
    results.topicStats.set(topicId, connections.size);
  }
  
  return results;
}

/**
 * Display validation results
 */
function displayResults(results, graph) {
  console.log(colors.bold('\nConnectivity Validation Results:'));
  
  // Overall stats
  console.log(`Total items: ${colors.blue(results.totalItems)}`);
  console.log(`Connected items: ${colors.green(results.connectedItems)} (${Math.round(results.connectedItems / results.totalItems * 100)}%)`);
  console.log(`Disconnected items: ${colors.red(results.disconnectedItems.length)}`);
  
  if (results.fullyConnected) {
    console.log(colors.green('\n✓ All content is connected to the topic hierarchy!'));
  } else {
    console.log(colors.red('\n✗ Some content is not connected to any topic!'));
    
    // Show disconnected items
    console.log(colors.yellow('\nDisconnected items:'));
    for (const item of results.disconnectedItems) {
      console.log(`- [${item.type}] ${colors.cyan(item.name)} (${item.id})`);
    }
  }
  
  // Topic connection stats
  if (options.verbose) {
    console.log(colors.bold('\nTopic Connection Statistics:'));
    
    // Sort topics by connection count
    const sortedTopics = Array.from(results.topicStats.entries())
      .sort((a, b) => b[1] - a[1]);
    
    for (const [topicId, count] of sortedTopics) {
      const topic = graph.topics.get(topicId);
      console.log(`- ${colors.cyan(topic.name)}: ${count} connected items`);
    }
  }
}

/**
 * Generate fix files for disconnected items
 */
async function generateFixes(disconnectedItems, graph, outputDir, dryRun) {
  console.log(colors.bold('\nGenerating Fixes:'));
  
  // Track statistics
  const stats = {
    totalItems: disconnectedItems.length,
    fixedItems: 0,
    skippedItems: 0,
    fixFiles: []
  };
  
  for (const item of disconnectedItems) {
    console.log(colors.cyan(`\nFor ${item.type} "${item.name}" (${item.id}):`));
    
    // Find the most suitable topic
    let bestTopic = null;
    let bestScore = 0;
    
    for (const [topicId, topic] of graph.topics.entries()) {
      const score = calculateTopicRelevance(item, topic, graph);
      
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
      }
    }
    
    if (bestTopic && bestScore > 0) {
      console.log(`Suggested topic: ${colors.green(bestTopic.name)} (${bestTopic.id})`);
      
      let fixContent = null;
      let fixFilename = null;
      
      // Generate a fix based on item type
      if (item.type === 'concept') {
        // Generate a predicate to connect this concept to the topic
        const predicateId = `urn:uor:predicate:fix-connect-${item.id.split(':').pop()}-to-${bestTopic.id.split(':').pop()}`;
        fixFilename = `${predicateId.split(':').pop()}.json`;
        
        fixContent = {
          "@context": "https://schema.org",
          "@type": "PropertyValue",
          "@id": predicateId,
          "name": "relatedTo",
          "propertyID": "uor:predicate",
          "value": "related concept",
          "subjectOf": {
            "@id": item.id
          },
          "targetCollection": [bestTopic.id],
          "valueName": `Connects ${item.name} to ${bestTopic.name} topic`,
          "valueReference": {
            "@type": "PropertyValue",
            "propertyID": "uor:predicateType",
            "value": "relates"
          },
          "additionalProperty": [
            {
              "@type": "PropertyValue",
              "propertyID": "uor:weight",
              "value": 1.0
            },
            {
              "@type": "PropertyValue",
              "propertyID": "uor:confidence",
              "value": 0.8
            },
            {
              "@type": "PropertyValue",
              "propertyID": "uor:auto-generated",
              "value": true
            }
          ],
          "dateCreated": new Date().toISOString(),
          "dateModified": new Date().toISOString()
        };
      } else if (item.type === 'resource') {
        // Generate a resource update to add isPartOf
        fixFilename = `${item.id.split(':').pop()}-update.json`;
        
        fixContent = {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": item.id,
          "name": item.name,
          "isPartOf": {
            "@id": bestTopic.id
          },
          "dateModified": new Date().toISOString(),
          "__note": "This is a partial update to add isPartOf. Merge with existing resource."
        };
      } else if (item.type === 'predicate') {
        // Generate a topic update to add this predicate to hasPart
        fixFilename = `${bestTopic.id.split(':').pop()}-update.json`;
        
        // Check if we already have a fix for this topic
        const existingFixIndex = stats.fixFiles.findIndex(f => 
          f.filename === fixFilename && f.type === 'topic-update');
          
        if (existingFixIndex >= 0) {
          // Add to existing fix
          stats.fixFiles[existingFixIndex].content.hasPart.push(item.id);
          console.log(`Added to existing topic update: ${fixFilename}`);
          stats.fixedItems++;
          continue;
        }
        
        fixContent = {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": bestTopic.id,
          "name": bestTopic.name,
          "hasPart": [item.id],
          "dateModified": new Date().toISOString(),
          "__note": "This is a partial update to add items to hasPart. Merge with existing topic."
        };
      }
      
      if (fixContent && fixFilename) {
        // Save or display the fix
        if (dryRun || !outputDir) {
          console.log('Generated fix (dry run):');
          console.log(JSON.stringify(fixContent, null, 2));
        } else {
          // Save to output directory
          const fixPath = path.join(outputDir, fixFilename);
          try {
            await fs.writeFile(fixPath, JSON.stringify(fixContent, null, 2));
            console.log(`Saved fix to: ${fixPath}`);
            
            // Track the fix
            stats.fixFiles.push({
              filename: fixFilename,
              path: fixPath,
              type: item.type === 'predicate' ? 'topic-update' : 
                    item.type === 'resource' ? 'resource-update' : 'predicate-create',
              content: fixContent
            });
          } catch (error) {
            console.error(colors.red(`Error saving fix file: ${error.message}`));
          }
        }
        
        stats.fixedItems++;
      } else {
        console.log(colors.yellow('Could not generate a fix for this item type.'));
        stats.skippedItems++;
      }
    } else {
      console.log(colors.yellow(`No suitable topic found automatically. Manual fix needed.`));
      stats.skippedItems++;
    }
  }
  
  // Create a summary file
  if (!dryRun && outputDir) {
    const summaryContent = {
      generatedAt: new Date().toISOString(),
      stats: {
        totalItems: stats.totalItems,
        fixedItems: stats.fixedItems,
        skippedItems: stats.skippedItems,
        fixedPercentage: Math.round((stats.fixedItems / stats.totalItems) * 100)
      },
      fixFiles: stats.fixFiles.map(f => ({
        filename: f.filename,
        type: f.type
      }))
    };
    
    try {
      await fs.writeFile(
        path.join(outputDir, 'fix-summary.json'), 
        JSON.stringify(summaryContent, null, 2)
      );
    } catch (error) {
      console.error(colors.red(`Error saving summary file: ${error.message}`));
    }
  }
  
  // Display summary
  console.log(colors.bold('\nFix Generation Summary:'));
  console.log(`Total disconnected items: ${colors.blue(stats.totalItems)}`);
  console.log(`Fixed items: ${colors.green(stats.fixedItems)} (${Math.round((stats.fixedItems / stats.totalItems) * 100)}%)`);
  console.log(`Skipped items: ${colors.yellow(stats.skippedItems)}`);
  console.log(`Fix files created: ${colors.green(stats.fixFiles.length)}`);
  
  if (!dryRun && outputDir) {
    console.log(colors.cyan('\nTo apply these fixes:'));
    console.log(`1. Review the generated files in: ${outputDir}`);
    console.log('2. Copy predicate files to your predicates directory');
    console.log('3. Merge updates with existing resource/topic files');
    console.log('4. Run the validation script again to confirm fixes');
  } else if (dryRun) {
    console.log(colors.yellow('\nThis was a dry run. Re-run without --dry-run to generate fix files.'));
  }
}

/**
 * Calculate relevance score of a topic for a disconnected item
 */
function calculateTopicRelevance(item, topic, graph) {
  let score = 0;
  
  // Name-based matching
  if (item.name && topic.name) {
    const itemNameWords = item.name.toLowerCase().split(/\s+/);
    const topicNameWords = topic.name.toLowerCase().split(/\s+/);
    
    // Count common words
    for (const word of itemNameWords) {
      if (word.length > 3 && topicNameWords.includes(word)) {
        score += 5;
      }
    }
  }
  
  // For concepts, check related concepts
  if (item.type === 'concept' && graph.concepts.has(item.id)) {
    const concept = graph.concepts.get(item.id);
    
    for (const relatedId of concept.relatedConcepts || []) {
      // If a related concept is in this topic, increase score
      if (graph.topicConnections.has(topic.id) && 
          graph.topicConnections.get(topic.id).has(relatedId)) {
        score += 10;
      }
    }
  }
  
  return score;
}

// Run the main function
main();