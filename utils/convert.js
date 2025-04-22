#!/usr/bin/env node

/**
 * MDX to Schema.org JSON Converter
 * 
 * Converts MDX content to Schema.org JSON format using the defined templates
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { program } = require('commander');
const { v4: uuidv4 } = require('uuid');

// Set up CLI options
program
  .name('convert')
  .description('Convert MDX content to Schema.org JSON format')
  .version('1.0.0')
  .option('-i, --input <path>', 'Input MDX file or directory')
  .option('-o, --output <path>', 'Output directory for JSON files', '../converted')
  .option('-t, --template-dir <path>', 'Path to the templates directory', '../templates')
  .option('-v, --verbose', 'Display detailed processing information', false)
  .parse(process.argv);

const options = program.opts();

// Main conversion function
async function main() {
  try {
    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    const templateDir = path.resolve(options.templateDir);
    
    // Load templates
    const templates = await loadTemplates(templateDir);
    
    // Process file or directory
    const stats = await fs.stat(inputPath);
    
    if (stats.isFile()) {
      await processMdxFile(inputPath, outputPath, templates);
    } else if (stats.isDirectory()) {
      await processMdxDirectory(inputPath, outputPath, templates);
    } else {
      throw new Error('Input path is neither a file nor a directory');
    }
    
    console.log('Conversion completed successfully!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Process a single MDX file
async function processMdxFile(filePath, outputDir, templates) {
  console.log(`Processing ${filePath}...`);
  
  // Read and parse MDX file
  const fileContent = await fs.readFile(filePath, 'utf8');
  const { data: frontmatter, content } = matter(fileContent);
  
  // Extract content parts
  const parsed = parseMdxContent(content);
  
  // Determine content type based on frontmatter or filename
  const contentType = determineContentType(frontmatter, filePath);
  
  // Convert to JSON using appropriate template
  const jsonContent = convertToJson(parsed, frontmatter, contentType, templates);
  
  // Write to output file
  const fileName = path.basename(filePath, path.extname(filePath));
  const outputSubdir = getOutputSubdir(contentType);
  const outputPath = path.join(outputDir, outputSubdir, `${fileName}.json`);
  
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  // Write JSON file
  await fs.writeFile(outputPath, JSON.stringify(jsonContent, null, 2), 'utf8');
  
  console.log(`Created ${outputPath}`);
  return jsonContent;
}

// Process a directory of MDX files
async function processMdxDirectory(dirPath, outputDir, templates) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Process subdirectory
      await processMdxDirectory(entryPath, outputDir, templates);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      // Process MDX file
      await processMdxFile(entryPath, outputDir, templates);
    }
  }
}

// Load template files
async function loadTemplates(templateDir) {
  const templates = {};
  
  try {
    const templateFiles = [
      'InformationResource.json',
      'Concept.json',
      'Topic.json',
      'FactPredicate.json'
    ];
    
    for (const templateFile of templateFiles) {
      const templatePath = path.join(templateDir, templateFile);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(templateContent);
      
      const templateName = path.basename(templateFile, '.json');
      templates[templateName] = template;
    }
    
    return templates;
  } catch (error) {
    throw new Error(`Failed to load templates: ${error.message}`);
  }
}

// Parse MDX content
function parseMdxContent(content) {
  return {
    headings: extractHeadings(content),
    codeBlocks: extractCodeBlocks(content),
    mathExpressions: extractMathExpressions(content),
    paragraphs: extractParagraphs(content)
  };
}

// Extract headings from MDX
function extractHeadings(content) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRegex)];
  return matches.map(match => ({
    level: match[1].length,
    text: match[2].trim()
  }));
}

// Extract code blocks from MDX
function extractCodeBlocks(content) {
  const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/gm;
  const matches = [...content.matchAll(codeBlockRegex)];
  return matches.map(match => ({
    language: match[1],
    code: match[2]
  }));
}

// Extract math expressions from MDX
function extractMathExpressions(content) {
  // Find inline and block math expressions
  const inlineMathRegex = /\$([^\$]+)\$/g;
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  
  const inlineMatches = [...content.matchAll(inlineMathRegex)];
  const blockMatches = [...content.matchAll(blockMathRegex)];
  
  return [
    ...inlineMatches.map(match => ({ type: 'inline', expr: match[1] })),
    ...blockMatches.map(match => ({ type: 'block', expr: match[1] }))
  ];
}

// Extract paragraphs from MDX
function extractParagraphs(content) {
  // Simple paragraph extraction
  return content
    .split(/\n\n+/)
    .filter(p => 
      p.trim() && 
      !p.startsWith('#') && 
      !p.startsWith('```') && 
      !p.includes('$$')
    )
    .map(p => p.trim());
}

// Determine content type from frontmatter or filename
function determineContentType(frontmatter, filePath) {
  // First check frontmatter
  if (frontmatter && frontmatter.type) {
    const type = frontmatter.type.toLowerCase();
    
    if (type === 'concept' || type === 'topic') {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    if (type === 'resource' || type === 'information') {
      return 'InformationResource';
    }
    
    if (type === 'predicate' || type === 'relation') {
      return 'FactPredicate';
    }
  }
  
  // Then infer from file name or path
  const fileName = path.basename(filePath).toLowerCase();
  const dirName = path.dirname(filePath).toLowerCase();
  
  if (fileName.includes('concept') || dirName.includes('concept')) {
    return 'Concept';
  }
  
  if (fileName.includes('topic') || dirName.includes('topic')) {
    return 'Topic';
  }
  
  if (fileName.includes('predicate') || dirName.includes('predicate') || 
      fileName.includes('relation') || dirName.includes('relation')) {
    return 'FactPredicate';
  }
  
  // Default to information resource
  return 'InformationResource';
}

// Determine output subdirectory based on content type
function getOutputSubdir(contentType) {
  switch (contentType) {
    case 'Concept':
      return 'concepts';
    case 'Topic':
      return 'topics';
    case 'FactPredicate':
      return 'predicates';
    case 'InformationResource':
    default:
      return 'resources';
  }
}

// Convert parsed MDX to JSON using templates
function convertToJson(parsed, frontmatter, contentType, templates) {
  const template = templates[contentType];
  
  if (!template) {
    throw new Error(`No template found for content type: ${contentType}`);
  }
  
  // Create a deep copy of the template
  const result = JSON.parse(JSON.stringify(template));
  
  // Fill in basic fields
  result['@id'] = frontmatter.id || `urn:uor:${contentType.toLowerCase()}:${uuidv4()}`;
  result.name = frontmatter.title || parsed.headings[0]?.text || '';
  result.description = frontmatter.description || parsed.paragraphs[0] || '';
  
  // Extract math expressions
  if (parsed.mathExpressions.length > 0 && result.mathExpression) {
    result.mathExpression = parsed.mathExpressions.map(m => m.expr);
  }
  
  // Handle content type specific conversions
  switch (contentType) {
    case 'Concept':
      result.termCode = frontmatter.code || `UOR-C-${Math.floor(Math.random() * 1000)}`;
      result.sourceText = parsed.paragraphs.join('\n\n');
      break;
      
    case 'InformationResource':
      result.text = parsed.paragraphs.join('\n\n');
      if (frontmatter.topic) {
        result.isPartOf.name = frontmatter.topic;
      }
      break;
      
    case 'Topic':
      // Add a placeholder URL template if not provided
      if (!result.potentialAction?.target?.urlTemplate) {
        result.potentialAction.target.urlTemplate = 
          `/topics/${result.name.toLowerCase().replace(/\s+/g, '-')}`;
      }
      break;
      
    case 'FactPredicate':
      if (frontmatter.source) {
        result.subjectOf = { '@id': frontmatter.source };
      }
      if (frontmatter.target) {
        result.targetCollection = Array.isArray(frontmatter.target) 
          ? frontmatter.target 
          : [frontmatter.target];
      }
      result.value = frontmatter.value || '';
      break;
  }
  
  // Add dates
  const now = new Date().toISOString();
  result.dateCreated = frontmatter.dateCreated || now;
  result.dateModified = frontmatter.dateModified || now;
  
  return result;
}

// Run main function
main();
