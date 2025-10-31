# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **phonetic text correction library** designed to fix transcription errors in meeting recordings and audio transcriptions. It uses phonetic matching algorithms to replace incorrectly recognized words/expressions with their canonical forms from a provided vocabulary.

The library is particularly effective for:
- Internal terms (proper nouns, acronyms, product names, project names)
- Multi-word expressions often mistranscribed by speech recognition engines
- Technical terminology and company-specific jargon

## Development Commands

### Build & Test
- `npm run build` - Build TypeScript to `dist/` directory with type definitions
- `npm test` - Run all Jest tests (unit tests and global evaluations)
- `npm run process-replacements` - Merge replacement fixtures from markdown files

### TypeScript Configuration
- Target: ES2020, ESM modules
- Strict mode enabled
- Output: `dist/` with declaration files (`.d.ts`)

## Core Architecture

### Service Layer

The library provides **two correction service implementations**:

1. **`TextCorrectorSimpleService`** (src/text-corrector-simple.service.ts)
   - Pure phonetic matching using Levenshtein distance on phonetic keys
   - Simple, fast, and predictable
   - Algorithm:
     - Check for exact case-insensitive matches first (returns similarity = 1.0)
     - Encode text with phonetic algorithm
     - Compare phonetic keys using `ratio()` function
     - Return best match if similarity >= threshold
   - Constructor: `(phoneticAlgorithm?, threshold?, debug?)`

2. **`TextCorrectorAdvancedService`** (src/text-corrector-advanced.service.ts)
   - More sophisticated scoring with multiple components
   - Configurable weights and length penalties
   - Better for complex correction scenarios

### Phonetic Algorithms

All located in `src/phonetic/`:

- **`DoubleMetaphoneAlgorithm`** - English phonetic encoding (default)
- **`FrenchSonnexAlgorithm`** - French-specific phonetic encoding (Soundex variant)
- **`FrenchPhoneticAlgorithm`** - Alternative French phonetic encoding

Each implements the `PhoneticAlgorithm` interface with `encode(text: string): string` method.

### N-gram Processing Strategy

Both services use **n-gram matching** (src/text-corrector-simple.service.ts:41-47):
- Generates n-grams of sizes 3, 2, 1 (longest first)
- Processes from longest to shortest to prioritize multi-word expressions
- Tracks processed positions to avoid overlapping replacements
- Example: "hello world test" → ["hello world test", "hello world", "world test", "hello", "world", "test"]

### Core Types (src/types.ts)

```typescript
interface CorrectionDetail {
    original: string;           // Original misrecognized text
    corrected: string;          // Canonical replacement
    position: [number, number]; // [start, end] word positions
    similarityScore: number;    // Match quality score (0-1)
}

interface CorrectionResult {
    originalText: string;
    correctedText: string;
    corrections: CorrectionDetail[];
}

interface PhoneticAlgorithm {
    encode(text: string): string;
}

interface TextCorrector {
    setVocabulary(terms: string[]): void;
    correctText(text: string): CorrectionResult;
}
```

### Utilities (src/utils.ts)

- **`ratio(a: string, b: string): number`** - Levenshtein-based similarity score (0-1)
  - Uses `fastest-levenshtein` for performance
  - Returns normalized similarity: `1 - (distance / maxLength)`

## Testing Architecture

### Test Structure

- **Unit tests**: `tests/simple/*.spec.ts` - Test individual correction scenarios
- **Global evaluations**: `tests/global-evaluations/global-evaluation.spec.ts` - Comprehensive corpus testing
- **Test fixtures**: `tests/global-evaluations/fixtures/correspondance-dataset-original/*.md` - Markdown files with replacement datasets

### Jest Configuration (jest.config.cjs)

- Uses `ts-jest` with ESM support
- Test patterns: `**/tests/**/*.spec.ts` and `**/src/**/*.spec.ts`
- Transforms: TypeScript via ts-jest, JavaScript via babel-jest
- Special handling for ESM modules: `double-metaphone`, `fastest-levenshtein`

### Running Tests

```bash
# All tests
npm test

# Specific test file
npx jest tests/simple/text-corrector.service.spec.ts

# With coverage
npx jest --coverage

# Watch mode
npx jest --watch
```

## Key Implementation Patterns

### Pre-computation of Phonetic Keys

Vocabulary phonetic keys are pre-computed in `setVocabulary()` to avoid repeated encoding:

```typescript
setVocabulary(terms: string[]) {
    this.vocabulary = terms;
    this.vocabularyPhonetic = new Map(
        terms.map(word => [word, this.phoneticAlgorithm.encode(word)])
    );
}
```

### Debug Mode

Both services support a `debug` constructor parameter that enables console logging of:
- Exact matches found
- Phonetic key comparisons
- Best match selection with scores

### Correction Algorithm Flow

1. Split input text into words (whitespace-separated)
2. Generate n-grams (sizes 3→2→1)
3. For each n-gram:
   - Skip if positions already processed
   - Find best vocabulary match via `findBestMatch()`
   - If score >= threshold, replace and mark positions as processed
4. Return corrected text with correction details

## Browser Compatibility

The library is **browser-compatible** (no Node.js-specific dependencies):
- Uses only standard JavaScript APIs
- ESM module format
- All dependencies are browser-safe
- Published as NPM package with TypeScript definitions

## Important Constraints

1. **No automatic text preprocessing**: The library does not lowercase or normalize input automatically. Handle casing via case-insensitive exact matching.

2. **No special symbol handling**: Symbols within terms (e.g., "+") are encoded directly by the phonetic algorithm. No special preprocessing is applied.

3. **Greedy n-gram matching**: Once a position is processed, it's locked. The longest-first strategy prevents re-evaluation of already corrected segments.

4. **Threshold-based filtering**: Only matches with `similarity >= threshold` are applied. No automatic threshold adjustment.

## Extending the Library

### Adding a New Phonetic Algorithm

1. Create file in `src/phonetic/`
2. Implement `PhoneticAlgorithm` interface
3. Export from `src/index.ts`
4. Add corresponding unit tests

Example:
```typescript
export class MyPhoneticAlgorithm implements PhoneticAlgorithm {
    encode(text: string): string {
        // Your encoding logic
        return encodedText;
    }
}
```

### Customizing Correction Logic

Both services implement the `TextCorrector` interface. To create a custom corrector:

1. Implement `TextCorrector` interface
2. Define `setVocabulary(terms: string[]): void`
3. Define `correctText(text: string): CorrectionResult`
4. Export from `src/index.ts`

## File Organization

```
src/
├── index.ts                              # Public API exports
├── types.ts                              # Core type definitions
├── utils.ts                              # Levenshtein ratio utility
├── text-corrector-simple.service.ts      # Simple phonetic corrector
├── text-corrector-advanced.service.ts    # Advanced multi-factor corrector
└── phonetic/
    ├── doubleMetaphone.ts                # English phonetic algorithm
    ├── frenchSonnex.ts                   # French Soundex variant
    └── frenchPhonetic.ts                 # Alternative French encoding

tests/
├── simple/                               # Unit tests
└── global-evaluations/                   # Corpus-based evaluation tests
    └── fixtures/                         # Test data in markdown format

scripts/
└── merge-replacements.ts                 # Fixture processing utility
```

## Dependencies

### Runtime
- `double-metaphone`: English phonetic encoding
- `fastest-levenshtein`: High-performance string distance
- `talisman`: French phonetic algorithms (Soundex, phonetic)

### Development
- `typescript`: Type checking and compilation
- `jest` + `ts-jest`: Testing framework
- `tsx`: TypeScript execution for scripts
- `js-yaml`: YAML processing for test fixtures
