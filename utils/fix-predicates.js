#!/usr/bin/env node

/**
 * Script to fix predicate files with incorrect additionalProperty structure
 */

const fs = require('fs').promises;
const path = require('path');

async function main() {
  const predicatesDir = path.resolve(__dirname, '../converted/predicates');
  
  try {
    // Get all .json files in the predicates directory
    const files = await fs.readdir(predicatesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    let fixedCount = 0;
    
    for (const file of jsonFiles) {
      const filePath = path.join(predicatesDir, file);
      
      try {
        // Read the file
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Check if additionalProperty is an object instead of an array
        if (data.additionalProperty && !Array.isArray(data.additionalProperty)) {
          console.log(`Fixing file: ${file}`);
          
          // Convert to array
          const originalProperty = data.additionalProperty;
          data.additionalProperty = [originalProperty];
          
          // Add required fields if missing
          if (!data.propertyID) {
            data.propertyID = "uor:predicate";
          }
          
          if (!data.targetCollection && data.valueReference && data.valueReference["@id"]) {
            data.targetCollection = [data.valueReference["@id"]];
          }
          
          if (!data.valueName && data.value) {
            data.valueName = data.value;
          }
          
          // If valueReference exists but doesn't have name property
          if (data.valueReference && !data.valueReference.name) {
            data.valueReference.name = "relation strength";
          }
          
          // If valueReference exists but doesn't have propertyID
          if (data.valueReference && !data.valueReference.propertyID) {
            data.valueReference.propertyID = "uor:predicateType";
          }
          
          // Ensure context is properly formed
          if (!data["@context"] || typeof data["@context"] === 'string') {
            data["@context"] = {
              "@vocab": "https://schema.org/",
              "uor": "https://uorframework.org/"
            };
          }
          
          // Write the fixed data back to the file
          await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
          fixedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${file}: ${err.message}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} files`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();