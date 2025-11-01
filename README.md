# Phonetic Text Corrector

A browser-compatible TypeScript library for fixing transcription errors in meeting recordings and audio transcriptions using phonetic matching algorithms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-v20.16.0-green.svg)](https://nodejs.org/)

## Features

- 🎯 **Phonetic Matching**: Replace incorrectly recognized words using phonetic similarity
- 🌍 **Multi-language Support**: English (Double Metaphone) and French (Sonnex, Phonetic) algorithms
- 🎨 **Simple & Advanced Modes**: Choose between fast phonetic matching or sophisticated multi-factor scoring
- 📊 **Detailed Reporting**: Track corrections with similarity scores and phonetic keys
- 🧪 **Comprehensive Testing**: Built-in evaluation framework with detailed error reporting
- 🌐 **Browser Compatible**: No Node.js-specific dependencies, works in any JavaScript environment
- ⚡ **Performance Optimized**: Pre-computed phonetic keys for fast lookups

## Use Cases

Perfect for correcting:
- **Internal terms**: Proper nouns, acronyms, product names, project names
- **Multi-word expressions**: Phrases often mistranscribed by speech recognition engines
- **Technical terminology**: Company-specific jargon and domain-specific vocabulary

## Quick Start

```typescript
import {
    TextCorrectorSimpleService,
    DoubleMetaphoneAlgorithm
} from 'phonetic-text-corrector';

// Initialize the corrector
const corrector = new TextCorrectorSimpleService(
    new DoubleMetaphoneAlgorithm(),  // Phonetic algorithm
    0.7,                              // Similarity threshold (0-1)
    false                             // Debug mode
);

// Set your vocabulary of correct terms
corrector.setVocabulary([
    'Kubernetes',
    'PostgreSQL',
    'Machine Learning'
]);

// Correct text with common transcription errors
const result = corrector.correctText('We use Cubernetes and Postgres QL for Masheen Lerning');

console.log(result.correctedText);
// Output: "We use Kubernetes and PostgreSQL for Machine Learning"

console.log(result.corrections);
// [
//   { original: 'Cubernetes', corrected: 'Kubernetes', position: [2, 3], similarityScore: 0.89 },
//   { original: 'Postgres QL', corrected: 'PostgreSQL', position: [4, 6], similarityScore: 0.92 },
//   { original: 'Masheen Lerning', corrected: 'Machine Learning', position: [7, 9], similarityScore: 0.85 }
// ]
```

## API Reference

### TextCorrectorSimpleService

The main correction service using pure phonetic matching.

#### Constructor

```typescript
new TextCorrectorSimpleService(
    phoneticAlgorithm?: PhoneticAlgorithm,  // Default: DoubleMetaphoneAlgorithm
    threshold?: number,                     // Default: 0.7 (0-1 range)
    debug?: boolean,                        // Default: false
    keepNgramEvaluations?: boolean          // Default: false
)
```

**Parameters:**
- `phoneticAlgorithm`: Algorithm for encoding text phonetically
- `threshold`: Minimum similarity score (0-1) to apply correction
- `debug`: Enable console logging of matching process
- `keepNgramEvaluations`: Track all n-gram evaluations for detailed reporting

#### Methods

##### `setVocabulary(terms: string[]): void`

Set the list of correct terms to use as reference vocabulary.

```typescript
corrector.setVocabulary([
    'React Native',
    'TypeScript',
    'Docker Compose',
    'GraphQL'
]);
```

##### `correctText(text: string): CorrectionResult`

Correct text by replacing misrecognized terms with vocabulary matches.

```typescript
const result = corrector.correctText('We deployed with Doker Compose and Graf QL');
```

**Returns:**
```typescript
interface CorrectionResult {
    originalText: string;
    correctedText: string;
    corrections: CorrectionDetail[];
    vocabularyPhoneticKeys?: Map<string, string>;  // If keepNgramEvaluations=true
    ngramEvaluations?: NgramEvaluation[];          // If keepNgramEvaluations=true
}

interface CorrectionDetail {
    original: string;           // Original misrecognized text
    corrected: string;          // Replacement term
    position: [number, number]; // [start, end] word positions
    similarityScore: number;    // Match quality (0-1)
}
```

### Phonetic Algorithms

#### DoubleMetaphoneAlgorithm (English)

```typescript
import { DoubleMetaphoneAlgorithm } from 'phonetic-text-corrector';

const algorithm = new DoubleMetaphoneAlgorithm();
const corrector = new TextCorrectorSimpleService(algorithm, 0.7);
```

#### FrenchSonnexAlgorithm (French Soundex Variant)

```typescript
import { FrenchSonnexAlgorithm } from 'phonetic-text-corrector';

const algorithm = new FrenchSonnexAlgorithm();
const corrector = new TextCorrectorSimpleService(algorithm, 0.7);
```

#### FrenchPhoneticAlgorithm (Alternative French)

```typescript
import { FrenchPhoneticAlgorithm } from 'phonetic-text-corrector';

const algorithm = new FrenchPhoneticAlgorithm();
const corrector = new TextCorrectorSimpleService(algorithm, 0.7);
```

### Advanced Service

For more sophisticated scoring with configurable weights:

```typescript
import { TextCorrectorAdvancedService } from 'phonetic-text-corrector';

const corrector = new TextCorrectorAdvancedService(
    new FrenchSonnexAlgorithm(),
    0.7,
    true,  // useStringWeight
    0.1    // lengthPenalty
);
```

## How It Works

### N-gram Processing Strategy

The corrector uses an **n-gram matching strategy** that prioritizes multi-word expressions:

1. **Split text into words** (whitespace-separated)
2. **Generate n-grams** of sizes 3, 2, 1 (longest first)
   - Example: "hello world test" → `["hello world test", "hello world", "world test", "hello", "world", "test"]`
3. **Process each n-gram**:
   - Skip if positions already processed
   - Find best vocabulary match using phonetic similarity
   - Apply correction if similarity score ≥ threshold
   - Mark positions as processed to avoid overlapping

### Matching Algorithm

For each n-gram:

1. **Exact match check** (case-insensitive) → similarity = 1.0
2. **Phonetic encoding** of both input and vocabulary terms
3. **Compare phonetic keys** using Levenshtein distance
4. **Return best match** if similarity ≥ threshold

### Phonetic Similarity

Similarity is calculated using the `ratio()` function:

```typescript
similarity = 1 - (levenshteinDistance / maxLength)
```

Returns a value between 0 (completely different) and 1 (identical).

## Examples

### Basic Correction

```typescript
import { TextCorrectorSimpleService, DoubleMetaphoneAlgorithm } from 'phonetic-text-corrector';

const corrector = new TextCorrectorSimpleService(
    new DoubleMetaphoneAlgorithm(),
    0.7
);

corrector.setVocabulary(['Amazon Web Services', 'Microsoft Azure', 'Google Cloud Platform']);

const result = corrector.correctText('We migrate from Amzon Web Services to Microsof Asher');

console.log(result.correctedText);
// "We migrate from Amazon Web Services to Microsoft Azure"
```

### With Debug Mode

```typescript
const corrector = new TextCorrectorSimpleService(
    new DoubleMetaphoneAlgorithm(),
    0.7,
    true  // Enable debug logging
);

corrector.setVocabulary(['TensorFlow']);
corrector.correctText('Tensor Flow');

// Console output:
// Matching 'Tensor Flow' (phonetic: TNSRFL)
//   Best match: 'TensorFlow' (phonetic: TNSRFL, score: 1.000)
```

### Detailed Error Analysis

```typescript
const corrector = new TextCorrectorSimpleService(
    new DoubleMetaphoneAlgorithm(),
    0.7,
    false,
    true  // Enable n-gram evaluations
);

corrector.setVocabulary(['PostgreSQL']);
const result = corrector.correctText('PostgressQL');

console.log(result.ngramEvaluations);
// [
//   {
//     ngram: 'PostgressQL',
//     ngramPhoneticKey: 'PSTK',
//     vocabularyBestMatch: 'PostgreSQL',
//     vocabularyBestMatchPhoneticKey: 'PSTK',
//     similarityScore: 0.64,
//     applied: false  // Score < threshold (0.7)
//   }
// ]
```

### Multi-word Expressions

This example demonstrates the power of n-gram matching for multi-word technical terms:

```typescript
corrector.setVocabulary([
    'Continuous Integration',
    'Continuous Deployment',
    'Natural Language Processing',
    'Artificial Intelligence'
]);

const result = corrector.correctText(
    'We use Continyous Integrashun and Natral Langwage Prosessing with Artfishal Inteligence'
);

console.log(result.correctedText);
// "We use Continuous Integration and Natural Language Processing with Artificial Intelligence"

// The corrector successfully matched multi-word expressions:
console.log(result.corrections);
// [
//   { original: 'Continyous Integrashun', corrected: 'Continuous Integration', ... },
//   { original: 'Natral Langwage Prosessing', corrected: 'Natural Language Processing', ... },
//   { original: 'Artfishal Inteligence', corrected: 'Artificial Intelligence', ... }
// ]
```

### Custom Phonetic Algorithm

```typescript
import { PhoneticAlgorithm } from 'phonetic-text-corrector';

class MyPhoneticAlgorithm implements PhoneticAlgorithm {
    encode(text: string): string {
        // Your custom encoding logic
        return text.toLowerCase().replace(/[aeiou]/g, '');
    }
}

const corrector = new TextCorrectorSimpleService(new MyPhoneticAlgorithm(), 0.7);
```

## Testing

The library includes a comprehensive testing framework:

```bash
# Run all tests
npm test

# Run specific test file
npx jest tests/simple/text-corrector.service.spec.ts

# Run global evaluations
npx jest tests/global-evaluations/global-evaluation.spec.ts

# With coverage
npx jest --coverage
```

### Test Fixtures

Test fixtures are stored as YAML files with replacement specifications:

```yaml
replacements:
  - target: Kubernetes
    toSearch:
      - Cubernetes
      - Kubernets
      - K8s
  - target: PostgreSQL
    toSearch:
      - Postgres QL
      - PostgressQL
      - Postgre SQL
```

## Development

### Setup

```bash
# Switch to correct Node.js version
nvm use

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Project Structure

```
src/
├── index.ts                              # Public API exports
├── types.ts                              # Type definitions
├── utils.ts                              # Utilities (ratio function)
├── text-corrector-simple.service.ts      # Simple phonetic corrector
├── text-corrector-advanced.service.ts    # Advanced corrector
└── phonetic/
    ├── doubleMetaphone.ts                # English algorithm
    ├── frenchSonnex.ts                   # French Soundex
    └── frenchPhonetic.ts                 # French phonetic

tests/
├── simple/                               # Unit tests
└── global-evaluations/                   # Corpus testing
    ├── text-corrector-factory.ts         # Test factory
    ├── evaluation-runner.ts              # Test runner
    └── fixtures/                         # Test data
```

## Browser Compatibility

The library is fully browser-compatible:
- ✅ No Node.js-specific APIs
- ✅ ESM module format
- ✅ All dependencies are browser-safe
- ✅ Works in modern browsers and Node.js

## Performance Considerations

- **Pre-computed phonetic keys**: Vocabulary terms are encoded once during `setVocabulary()`
- **Fast lookups**: Uses `Map` for O(1) phonetic key retrieval
- **Optimized string distance**: Uses `fastest-levenshtein` library
- **Greedy n-gram matching**: Processes positions once (no re-evaluation)

## Limitations

1. **No automatic preprocessing**: Text is not automatically lowercased or normalized
2. **No special symbol handling**: Symbols are encoded directly by phonetic algorithms
3. **Greedy matching**: Once a position is processed, it cannot be re-evaluated
4. **Threshold-based**: Only matches ≥ threshold are applied (no automatic adjustment)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Adding a New Phonetic Algorithm

1. Create a file in `src/phonetic/`
2. Implement the `PhoneticAlgorithm` interface:
   ```typescript
   export interface PhoneticAlgorithm {
       encode(text: string): string;
   }
   ```
3. Export from `src/index.ts`
4. Add unit tests

## License

MIT © 2025

## Dependencies

### Runtime
- [double-metaphone](https://www.npmjs.com/package/double-metaphone) - English phonetic encoding
- [fastest-levenshtein](https://www.npmjs.com/package/fastest-levenshtein) - String distance calculation
- [talisman](https://www.npmjs.com/package/talisman) - French phonetic algorithms

### Development
- TypeScript 5.0+
- Jest for testing
- tsx for script execution
