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
    // Check for errors in any result files
    const hasInvalid = results.some(result => !result.valid);
    
    // Check for warnings in any result files (treat warnings as errors)
    const hasWarnings = results.some(result => result.warnings && result.warnings.length > 0);
    
    // Fail if we have invalid results or warnings
    if (hasInvalid || hasWarnings) {
      console.error(chalk.red('\nValidation failed due to errors or warnings'));
      process.exit(1);
    } else {
      process.exit(0);
    }
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
  
  // Consider file invalid if it has warnings
  const hasWarnings = warnings && warnings.length > 0;
  
  if (valid && !hasWarnings) {
    console.log(chalk.green(`✓ ${filePath}`) + chalk.gray(` [${type}]`));
  } else {
    // Show errors
    if (!valid) {
      console.log(chalk.red(`✗ ${filePath} (ERRORS)`));
      
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
    
    // Show warnings as errors
    if (hasWarnings) {
      console.log(chalk.red(`✗ ${filePath} (WARNINGS TREATED AS ERRORS)`));
      
      if (options.verbose || !valid) {
        for (const warning of warnings) {
          console.log(
            chalk.gray('  - ') + 
            chalk.red(warning.message)
          );
        }
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
  console.log(`Warnings: ${chalk.red(warningCount || 0)} (TREATED AS ERRORS)`);
  
  if (invalidFiles === 0 && warningCount === 0) {
    console.log(chalk.green('\nAll files are valid with no warnings!'));
  } else {
    if (invalidFiles > 0) {
      console.log(chalk.red(`\n${invalidFiles} file(s) have validation errors.`));
    }
    
    if (warningCount > 0) {
      console.log(chalk.red(`\n${warningCount} file(s) have warnings that are being treated as errors.`));
      console.log(chalk.gray('Run with --verbose to see specific warnings'));
    }
    
    console.log(chalk.red('\nValidation FAILED - fix all errors and warnings before proceeding'));
  }
}

// Run main function
main();
