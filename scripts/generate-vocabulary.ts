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
  replacements: Replacement[];
}

interface VocabularyOutput {
  category: string;
  vocabulary: string[];
}

/**
 * Extract unique vocabulary from replacements array
 */
function extractVocabularyFromReplacements(replacements: Replacement[]): string[] {
  // Extract all target values, trim whitespace, and deduplicate using Set
  const uniqueTargets = new Set(replacements.map(replacement => replacement.target.trim()));

  // Convert to array and sort alphabetically
  return Array.from(uniqueTargets).sort();
}

/**
 * Process a single replacement YAML file and generate corresponding vocabulary file
 */
function processReplacementFile(inputPath: string, outputDir: string): void {
  const fileName = path.basename(inputPath, '.yaml');

  // Extract category name by removing "replacements-" prefix
  const categoryName = fileName.replace(/^replacements-/, '');

  // Read and parse YAML file
  const yamlContent = fs.readFileSync(inputPath, 'utf-8');
  let parsedYaml: YamlContent;

  try {
    parsedYaml = yaml.load(yamlContent) as YamlContent;
  } catch (error) {
    console.error(`  ❌ Error parsing YAML in ${fileName}.yaml:`, error);
    return;
  }

  // Extract vocabulary from replacements
  const vocabulary = extractVocabularyFromReplacements(parsedYaml.replacements || []);

  // Create output object with category and vocabulary
  const output: VocabularyOutput = {
    category: categoryName,
    vocabulary: vocabulary
  };

  // Serialize to YAML
  const yamlOutput = yaml.dump(output, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });

  // Build output path in vocabulary-output/ directory with vocabulary- prefix
  const outputFileName = `vocabulary-${categoryName}.yaml`;
  const outputPath = path.join(outputDir, outputFileName);

  // Write output file
  fs.writeFileSync(outputPath, yamlOutput, 'utf-8');

  // Log success message with category name and vocabulary count
  console.log(`  ✅ Created: ${outputFileName} (${vocabulary.length} terms)`);
}

/**
 * Main function
 */
function main(): void {
  const inputDir = path.join(__dirname, '../tests/global-evaluations/fixtures/correspondance-dataset');
  const outputDir = path.join(__dirname, '../tests/global-evaluations/fixtures/vocabulary-output');

  // Log start message with emoji
  console.log('🚀 Starting vocabulary generation process...\n');

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Read all files from inputDir
  const files = fs.readdirSync(inputDir);

  // Filter for files starting with replacements- and ending with .yaml
  const replacementFiles = files.filter(
    file => file.startsWith('replacements-') && file.endsWith('.yaml')
  );

  // Check if any files found
  if (replacementFiles.length === 0) {
    console.log('⚠️  No replacement files found in input directory');
    return;
  }

  console.log(`Found ${replacementFiles.length} replacement file(s)\n`);

  // Process each file with try-catch error handling
  let successCount = 0;
  replacementFiles.forEach(file => {
    const inputPath = path.join(inputDir, file);
    try {
      processReplacementFile(inputPath, outputDir);
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  });

  // Log final summary
  console.log(`\n✨ Generation complete: ${successCount}/${replacementFiles.length} files processed successfully`);
}

// Call main function
main();
