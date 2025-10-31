#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Replacement {
  target: string;
  toSearch: string[];
}

interface YamlContent {
  category?: string;
  replacements: Replacement[];
}

/**
 * Extract YAML content from markdown code fence
 */
function extractYamlFromMarkdown(content: string): string | null {
  const yamlBlockRegex = /```yaml\s*\n([\s\S]*?)\n```/;
  const match = content.match(yamlBlockRegex);
  return match ? match[1] : null;
}

/**
 * Process a single markdown file and generate corresponding YAML file
 */
function processMarkdownFile(inputPath: string, outputDir: string): void {
  const fileName = path.basename(inputPath, '.md');
  const outputPath = path.join(outputDir, `${fileName}.yaml`);

  console.log(`Processing: ${fileName}.md`);

  // Read markdown file
  const markdownContent = fs.readFileSync(inputPath, 'utf-8');

  // Extract YAML block
  const yamlContent = extractYamlFromMarkdown(markdownContent);
  if (!yamlContent) {
    console.warn(`  ⚠️  No YAML block found in ${fileName}.md`);
    return;
  }

  // Parse YAML
  let parsedYaml: YamlContent;
  try {
    parsedYaml = yaml.load(yamlContent) as YamlContent;
  } catch (error) {
    console.error(`  ❌ Error parsing YAML in ${fileName}.md:`, error);
    return;
  }

  // Remove category field and keep only replacements
  const outputYaml = {
    replacements: parsedYaml.replacements || []
  };

  // Write output YAML file
  const yamlOutput = yaml.dump(outputYaml, {
    indent: 2,
    lineWidth: -1, // Disable line wrapping
    noRefs: true,
    sortKeys: false
  });

  fs.writeFileSync(outputPath, yamlOutput, 'utf-8');
  console.log(`  ✅ Created: ${fileName}.yaml (${outputYaml.replacements.length} replacements)`);
}

/**
 * Main function
 */
function main(): void {
  const inputDir = path.join(__dirname, '../tests/fixtures/correspondance-dataset-original');
  const outputDir = path.join(__dirname, '../tests/fixtures/correspondance-dataset');

  console.log('🚀 Starting YAML conversion process...\n');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all markdown files from input directory
  const files = fs.readdirSync(inputDir);
  const markdownFiles = files.filter(file => file.endsWith('.md'));

  if (markdownFiles.length === 0) {
    console.log('⚠️  No markdown files found in input directory');
    return;
  }

  console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

  // Process each markdown file
  let successCount = 0;
  markdownFiles.forEach(file => {
    const inputPath = path.join(inputDir, file);
    try {
      processMarkdownFile(inputPath, outputDir);
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  });

  console.log(`\n✨ Conversion complete: ${successCount}/${markdownFiles.length} files processed successfully`);
}

// Run the script
main();
