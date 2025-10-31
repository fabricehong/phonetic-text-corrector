import { PhoneticAlgorithm, CorrectionResult, CorrectionDetail, TextCorrector } from './types';
import { DoubleMetaphoneAlgorithm } from './phonetic/doubleMetaphone';
import { ratio } from './utils';

export class TextCorrectorSimpleService implements TextCorrector {
    private vocabulary: string[] = [];
    private phoneticAlgorithm: PhoneticAlgorithm;
    private threshold: number = 0.7;
    private debug: boolean;
    private vocabularyPhonetic: Map<string, string>;

    constructor(
        phoneticAlgorithm: PhoneticAlgorithm | null = null,
        threshold: number = 0.7,
        debug: boolean = false
    ) {
        this.phoneticAlgorithm = phoneticAlgorithm || new DoubleMetaphoneAlgorithm();
        this.threshold = threshold;
        this.debug = debug;

        // Pre-compute phonetic keys for vocabulary
        this.vocabularyPhonetic = new Map();
    }

    setVocabulary(terms: string[]) {
        this.vocabulary = terms;
        this.vocabularyPhonetic = new Map(
            terms.map(word => [word, this.phoneticAlgorithm.encode(word)])
        );
    }

    correctText(text: string): CorrectionResult {
        if (!text) {
            return { originalText: text, correctedText: text, corrections: [] };
        }

        // Split text into words
        const words = text.split(/\s+/);
        this.debugPrint(`Input text split into words: ${words}`);

        // Generate n-grams of different sizes (1, 2, 3 words)
        const ngrams: [number, number, string][] = [];
        for (let n = 3; n >= 1; n--) {
            for (let i = 0; i <= words.length - n; i++) {
                ngrams.push([i, i + n, words.slice(i, i + n).join(' ')]);
            }
        }
        this.debugPrint(`Generated n-grams: ${ngrams.map(ng => ng[2])}`);

        const correctedText = [...words];
        const processedPositions = new Set<number>();
        const corrections: CorrectionDetail[] = [];

        for (const [start, end, ngram] of ngrams) {
            // Skip if positions in this n-gram have already been processed
            if ([...Array(end - start)].some((_, i) => processedPositions.has(start + i))) {
                const processedIndices = [...Array(end - start)]
                    .map((_, i) => start + i)
                    .filter(i => processedPositions.has(i))
                    .map(i => `'${words[i]}'(position ${i})`);
                this.debugPrint(`Skipping n-gram '${ngram}': Containing already processed words: ${processedIndices.join(', ')}`);
                continue;
            }

            const [bestMatch, similarity] = this.findBestMatch(ngram);

            if (bestMatch && similarity >= this.threshold) {
                // Replace n-gram words with the match
                correctedText.splice(start, end - start, bestMatch, ...Array(end - start - 1).fill(''));
                for (let i = start; i < end; i++) {
                    processedPositions.add(i);
                }
                corrections.push({
                    original: ngram,
                    corrected: bestMatch,
                    position: [start, end],
                    similarityScore: similarity
                });
            }
        }

        const result = correctedText.filter(word => word).join(' ');
        return {
            originalText: text,
            correctedText: result,
            corrections
        };
    }

    private findBestMatch(text: string): [string | null, number] {
        if (!text || text.length < 2) {
            return [null, 0];
        }

        // Check for exact matches first (case-insensitive)
        const exactMatch = this.vocabulary.find(word => word.toLowerCase() === text.toLowerCase());
        if (exactMatch) {
            this.debugPrint(`Exact match found: '${text}' -> '${exactMatch}'`);
            return [exactMatch, 1.0];
        }

        const textKey = this.phoneticAlgorithm.encode(text) || '';
        this.debugPrint(`\nMatching '${text}' (phonetic: ${textKey})`);

        let bestMatch: string | null = null;
        let bestScore = 0;

        for (const ref of this.vocabulary) {
            const refKey = this.vocabularyPhonetic.get(ref) || '';
            const similarity = textKey && refKey ? ratio(textKey, refKey) : 0;

            if (similarity >= this.threshold && similarity > bestScore) {
                bestMatch = ref;
                bestScore = similarity;
                this.debugPrint(`  Best match: '${ref}' (phonetic: ${refKey}, score: ${similarity.toFixed(3)})`);
            }
        }

        return [bestMatch, bestScore];
    }

    private debugPrint(...args: any[]): void {
        if (this.debug) {
            console.log(...args);
        }
    }
}
