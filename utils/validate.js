#!/usr/bin/env node

/**
 * Schema.org Content Validation CLI
 * 
 * Command-line tool to validate Schema.org JSON content
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const { SchemaValidator } = require('./validator');

// Set up CLI options
program
  .name('validate')
  .description('Validate Schema.org JSON content against templates')
  .version('1.0.0')
  .option('-f, --file <path>', 'Validate a single file')
  .option('-d, --directory <path>', 'Validate all JSON files in a directory')
  .option('-r, --recursive', 'Recursively validate files in subdirectories', true)
  .option('-t, --template-dir <path>', 'Path to the templates directory', '../templates')
  .option('-s, --schema <type>', 'Schema type to validate against (optional)')
  .option('-v, --verbose', 'Display detailed error information and warnings', false)
  .option('--summary', 'Only display summary results', false)
  .option('--links', 'Validate cross-references between content items', true)
  .option('--math', 'Validate mathematical expressions', true)
  .option('--dates', 'Validate date formats and consistency', true)
  .parse(process.argv);

const options = program.opts();

// Main validation function
async function main() {
  try {
    // Resolve template directory path
    const templatesDir = path.resolve(__dirname, options.templateDir);
    
    // Create and initialize validator
    const validator = new SchemaValidator(templatesDir);
    await validator.initialize();
    
    // Track results
    let results = [];
    
    // Validate file or directory
    if (options.file) {
      const filePath = path.resolve(options.file);
      const result = await validator.validateFile(filePath, options.schema);
      results.push(result);
      
      if (!options.summary) {
        displayFileResult(result);
      }
    } else if (options.directory) {
      const dirPath = path.resolve(options.directory);
      const dirResults = await validator.validateDirectory(dirPath, {
        recursive: options.recursive
      });
      
      results = dirResults.fileResults;
      
      if (!options.summary) {
        for (const result of results) {
          displayFileResult(result);
        }
      }
      
      displaySummary(dirResults);
    } else {
      console.error(chalk.red('Error: Either --file or --directory must be specified'));
      process.exit(1);
    }
    
    // Exit with appropriate code
    const hasInvalid = results.some(result => !result.valid);
    process.exit(hasInvalid ? 1 : 0);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Display validation result for a single file
function displayFileResult(result) {
  const { valid, filePath, errors = [], warnings = [], type } = result;
  
  if (valid) {
    console.log(chalk.green(`✓ ${filePath}`) + chalk.gray(` [${type}]`));
    
    // Display warnings even for valid files if verbose
    if (options.verbose && warnings && warnings.length > 0) {
      console.log(chalk.yellow(`  Warnings for ${filePath}:`));
      for (const warning of warnings) {
        console.log(
          chalk.gray('  - ') + 
          chalk.yellow(warning.message)
        );
      }
    }
  } else {
    console.log(chalk.red(`✗ ${filePath}`));
    
    if (options.verbose && errors) {
      for (const error of errors) {
        console.log(
          chalk.gray('  - ') + 
          chalk.yellow(error.instancePath || '<root>') + ': ' + 
          chalk.red(error.message || error)
        );
      }
    }
  }
}

// Display summary of validation results
function displaySummary(results) {
  const { totalFiles, validFiles, invalidFiles, warningCount } = results;
  
  console.log(chalk.bold('\nValidation Summary:'));
  console.log(`Total files: ${chalk.blue(totalFiles)}`);
  console.log(`Valid: ${chalk.green(validFiles)}`);
  console.log(`Invalid: ${chalk.red(invalidFiles)}`);
  console.log(`Warnings: ${chalk.yellow(warningCount || 0)}`);
  
  if (invalidFiles === 0) {
    if (warningCount === 0) {
      console.log(chalk.green('\nAll files are valid with no warnings!'));
    } else {
      console.log(chalk.green('\nAll files are valid!') + chalk.yellow(` (But there are ${warningCount} warnings)`));
      console.log(chalk.gray('Run with --verbose to see warnings'));
    }
  } else {
    console.log(chalk.yellow(`\n${invalidFiles} file(s) have validation errors.`));
  }
}

// Run main function
main();
