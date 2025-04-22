/**
 * Fix Validator
 * 
 * Fixes the validator to properly handle hasPart objects
 */

const fs = require('fs').promises;
const path = require('path');

async function fixValidator(validatorPath) {
  console.log(`Fixing validator at ${validatorPath}...`);
  
  try {
    // Read the validator file
    const content = await fs.readFile(validatorPath, 'utf8');
    
    // Fix the validateCreativeWork function to handle hasPart objects properly
    const fixedContent = content.replace(
      `    // Check for hasPart references
    if (resource.hasPart && resource.hasPart.length > 0) {
      resource.hasPart.forEach(partId => {
        if (!this.isValidResourceId(partId, null, contentIndex)) {
          result.warnings.push({
            message: \`hasPart reference with ID "\${partId}" could not be verified in the index\`
          });
        }
      });
    }`,
      `    // Check for hasPart references
    if (resource.hasPart && resource.hasPart.length > 0) {
      resource.hasPart.forEach(part => {
        // Handle both string IDs and object references
        const partId = typeof part === 'string' ? part : (part['@id'] || part);
        
        if (typeof partId === 'string') {
          if (!this.isValidResourceId(partId, null, contentIndex)) {
            result.warnings.push({
              message: \`hasPart reference with ID "\${partId}" could not be verified in the index\`
            });
          }
        } else if (typeof part === 'object') {
          // For object references, just warn if they're not in the right format
          if (!part['@id'] || typeof part['@id'] !== 'string') {
            result.warnings.push({
              message: \`hasPart contains an object without a valid @id: \${JSON.stringify(part)}\`
            });
          }
        }
      });
    }`
    );
    
    // Write the fixed validator
    await fs.writeFile(validatorPath, fixedContent);
    console.log('Validator fixed successfully');
  } catch (error) {
    console.error(`Error fixing validator: ${error.message}`);
    throw error;
  }
}

// Process command line arguments
if (require.main === module) {
  const validatorPath = process.argv[2] || './validator.js';
  
  fixValidator(validatorPath)
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixValidator };