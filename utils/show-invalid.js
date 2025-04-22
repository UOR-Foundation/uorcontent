/**
 * Show Invalid Files
 * 
 * Shows which files are invalid and their errors
 */

const fs = require('fs').promises;
const path = require('path');
const { SchemaValidator } = require('./validator');

async function showInvalidFiles(contentDir) {
  console.log(`Checking for invalid files in ${contentDir}...`);
  
  // Initialize the validator
  const validator = new SchemaValidator('./templates');
  await validator.initialize();
  
  // Build the content index for reference validation
  const contentIndex = await validator.buildContentIndex(contentDir);
  
  // Process all files in the directory
  const allFiles = await findJsonFiles(contentDir);
  console.log(`Found ${allFiles.length} JSON files to check`);
  
  // Track invalid files
  const invalidFiles = [];
  
  // Validate each file
  for (const file of allFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const json = JSON.parse(content);
      
      const result = validator.validate(json, null, contentIndex);
      
      if (!result.valid) {
        invalidFiles.push({
          file,
          errors: result.errors
        });
        
        console.log(`❌ Invalid file: ${file}`);
        console.log('  Errors:');
        result.errors.forEach(error => {
          console.log(`  - ${error.message}`);
        });
        console.log();
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  console.log(`Found ${invalidFiles.length} invalid files`);
  return invalidFiles;
}

// Find all JSON files in a directory
async function findJsonFiles(dir) {
  const results = [];
  
  async function scanDir(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentDir}: ${error.message}`);
    }
  }
  
  await scanDir(dir);
  return results;
}

// Process command line arguments
if (require.main === module) {
  const contentDir = process.argv[2] || '../converted';
  
  showInvalidFiles(contentDir)
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { showInvalidFiles };