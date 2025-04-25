#!/usr/bin/env node

/**
 * UOR Framework Complete Content Connectivity Script
 * 
 * This script analyzes all disconnected content and creates direct connections to topics
 */

const fs = require('fs').promises;
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

const contentDir = path.resolve('./content/converted');

// Define mappings for connecting items to topics
const conceptMappings = [
  // Media Type related concepts -> Internet Substrate
  { pattern: /media-type/i, topic: 'internet-substrate' },
  { pattern: /distributed-compute/i, topic: 'internet-substrate' },
  { pattern: /network-/i, topic: 'internet-substrate' },
  { pattern: /protocol-/i, topic: 'internet-substrate' },
  
  // Prime related concepts -> Prime Foundations
  { pattern: /intrinsic-prime/i, topic: 'prime-foundations' },
  { pattern: /prime-/i, topic: 'prime-foundations' },
  { pattern: /factorization/i, topic: 'prime-foundations' },
  { pattern: /coordinate/i, topic: 'prime-foundations' },
  
  // Coherence related concepts -> Temporal Coherence
  { pattern: /coherence/i, topic: 'temporal-coherence' },
  { pattern: /norm/i, topic: 'temporal-coherence' },
  
  // Axiom related concepts -> Core Axioms
  { pattern: /axiom/i, topic: 'core-axioms' },
  
  // Extension and advanced concepts -> Extensions
  { pattern: /extension/i, topic: 'extensions' },
  { pattern: /generalization/i, topic: 'extensions' },
  { pattern: /applications/i, topic: 'extensions' },
  
  // Other concepts -> Universal Object Reference (fallback)
  { pattern: /.*/, topic: 'universal-object-reference' }
];

const predicateMappings = [
  // Core predicates
  { pattern: /defines|describes|explains|introduces/i, topic: 'universal-object-reference' },
  
  // Extension related predicates
  { pattern: /extends|application|presents|generalizes/i, topic: 'extensions' },
  
  // Temporal related predicates
  { pattern: /temporal|coherence|time/i, topic: 'temporal-coherence' },
  
  // Prime Foundation predicates
  { pattern: /prime|factorization|coordinates/i, topic: 'prime-foundations' },
  
  // Internet predicates
  { pattern: /network|protocol|computing/i, topic: 'internet-substrate' },
  
  // Meaning predicates
  { pattern: /meaning|semantic|consciousness/i, topic: 'meaning' },
  
  // Music predicates
  { pattern: /music|harmony|spectral/i, topic: 'music' },
  
  // Learning predicates
  { pattern: /learning|implementation|guide/i, topic: 'learning-implementation' },
  
  // Advanced predicates
  { pattern: /mathematical|quantum|physics|spacetime/i, topic: 'advanced-extensions' },
  
  // Signal predicates
  { pattern: /signal|compression|encoding/i, topic: 'signal-processing' },
  
  // Fallback to UOR
  { pattern: /.*/, topic: 'universal-object-reference' }
];

// Define map of topic ids to readable names
const topicNames = {
  'universal-object-reference': 'Universal Object Reference',
  'universal-coordinates': 'Universal Coordinates',
  'temporal-coherence': 'Temporal Coherence',
  'signal-processing': 'Signal Processing',
  'internet-substrate': 'Internet Substrate',
  'prime-foundations': 'Prime Foundations',
  'core-axioms': 'Eight Core UOR Axioms',
  'extensions': 'Extensions & Applications',
  'meaning': 'Meaning',
  'learning-implementation': 'Learning and Implementation',
  'advanced-extensions': 'Advanced Extensions',
  'music': 'Music'
};

async function main() {
  try {
    console.log(colors.bold('UOR Framework Complete Content Connectivity'));
    console.log(`Content directory: ${contentDir}\n`);
    
    // Load all items and identify disconnected ones
    const { topics, disconnectedItems } = await loadAndAnalyzeContent();
    
    // Apply direct connection fixes by adding to topic's hasPart
    await applyDirectConnections(topics, disconnectedItems);
    
    // Generate summary
    console.log(colors.green('\nFixes complete!'));
    console.log(colors.cyan('\nNext steps:'));
    console.log('1. Run the validation script to check connectivity');
    console.log('2. Run the index generation script to update indices');
    
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

async function loadAndAnalyzeContent() {
  console.log(colors.cyan('Loading and analyzing content...'));
  
  // Load topics
  const topicsDir = path.join(contentDir, 'topics');
  const topicFiles = await fs.readdir(topicsDir);
  const topics = new Map(); // Map of topic ID to topic object
  
  for (const file of topicFiles) {
    if (!file.endsWith('.json')) continue;
    
    const topicPath = path.join(topicsDir, file);
    const topicContent = await fs.readFile(topicPath, 'utf8');
    const topic = JSON.parse(topicContent);
    
    const topicId = topic['@id'];
    const existingHasPart = Array.isArray(topic.hasPart) ? topic.hasPart : [];
    
    // Extract IDs from hasPart
    const connectedIds = new Set();
    for (const part of existingHasPart) {
      if (typeof part === 'string') {
        connectedIds.add(part);
      } else if (part['@id']) {
        connectedIds.add(part['@id']);
      }
    }
    
    topics.set(topicId, {
      id: topicId,
      name: topic.name,
      fileName: file,
      filePath: topicPath,
      connectedIds: connectedIds,
      hasPart: existingHasPart,
      json: topic
    });
  }
  
  console.log(colors.green(`Loaded ${topics.size} topics`));
  
  // Load all item IDs by type
  const conceptIds = await loadItemIds(path.join(contentDir, 'concepts'));
  const resourceIds = await loadItemIds(path.join(contentDir, 'resources'));
  const predicateIds = await loadItemIds(path.join(contentDir, 'predicates'));
  
  console.log(colors.green(`Found ${conceptIds.size} concepts, ${resourceIds.size} resources, and ${predicateIds.size} predicates`));
  
  // Find disconnected items (not connected to any topic)
  const disconnectedItems = [];
  
  // Function to check if an item is connected to any topic
  function isConnected(itemId) {
    for (const topic of topics.values()) {
      if (topic.connectedIds.has(itemId)) {
        return true;
      }
    }
    return false;
  }
  
  // Check concepts
  for (const [conceptId, name] of conceptIds) {
    if (!isConnected(conceptId)) {
      disconnectedItems.push({
        id: conceptId,
        name: name,
        type: 'concept'
      });
    }
  }
  
  // Check resources
  for (const [resourceId, name] of resourceIds) {
    if (!isConnected(resourceId)) {
      disconnectedItems.push({
        id: resourceId,
        name: name,
        type: 'resource'
      });
    }
  }
  
  // Check predicates
  for (const [predicateId, name] of predicateIds) {
    if (!isConnected(predicateId)) {
      disconnectedItems.push({
        id: predicateId,
        name: name,
        type: 'predicate'
      });
    }
  }
  
  console.log(colors.yellow(`Found ${disconnectedItems.length} disconnected items`));
  
  return { topics, disconnectedItems };
}

async function loadItemIds(directory) {
  const itemIds = new Map(); // Map of item ID to name
  
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(directory, file);
      const content = await fs.readFile(filePath, 'utf8');
      const item = JSON.parse(content);
      
      const itemId = item['@id'];
      if (itemId) {
        itemIds.set(itemId, item.name || 'unnamed');
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  return itemIds;
}

async function applyDirectConnections(topics, disconnectedItems) {
  console.log(colors.cyan('\nApplying direct connections...'));
  
  // Group disconnected items by topic to reduce the number of file writes
  const topicItemMap = new Map(); // Map of topic ID to array of items to add
  
  // Determine which topic each disconnected item belongs to
  for (const item of disconnectedItems) {
    let targetTopic = 'universal-object-reference'; // Default fallback
    
    // Use the appropriate mapping based on item type
    const mappings = item.type === 'concept' ? conceptMappings : predicateMappings;
    
    // Find the first mapping that matches the item ID
    for (const mapping of mappings) {
      if (mapping.pattern.test(item.id)) {
        targetTopic = mapping.topic;
        break;
      }
    }
    
    // Convert topic short name to full URN
    const topicId = `urn:uor:topic:${targetTopic}`;
    
    // Add to group
    if (!topicItemMap.has(topicId)) {
      topicItemMap.set(topicId, []);
    }
    topicItemMap.get(topicId).push(item);
  }
  
  // Apply changes to each topic
  for (const [topicId, itemsToAdd] of topicItemMap.entries()) {
    const topic = topics.get(topicId);
    if (!topic) {
      console.warn(colors.yellow(`Warning: Topic ${topicId} not found, skipping ${itemsToAdd.length} items`));
      continue;
    }
    
    console.log(`Adding ${itemsToAdd.length} items to ${topic.name}`);
    
    // Add items to hasPart
    for (const item of itemsToAdd) {
      // Skip if already connected
      if (topic.connectedIds.has(item.id)) {
        continue;
      }
      
      // Add to hasPart and connectedIds
      topic.hasPart.push(item.id);
      topic.connectedIds.add(item.id);
    }
    
    // Update topic JSON
    topic.json.hasPart = topic.hasPart;
    topic.json.dateModified = new Date().toISOString();
    
    // Write back to file
    await fs.writeFile(topic.filePath, JSON.stringify(topic.json, null, 2));
    console.log(colors.green(`Updated ${topic.fileName}`));
  }
  
  // Print summary
  console.log(colors.bold('\nConnection Summary:'));
  for (const [topicId, itemsToAdd] of topicItemMap.entries()) {
    const topicName = topics.get(topicId).name;
    console.log(`- ${colors.cyan(topicName)}: ${itemsToAdd.length} items added`);
  }
}

// Run the main function
main();