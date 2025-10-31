import { PhoneticAlgorithm, CorrectionResult, CorrectionDetail, TextCorrector, NgramEvaluation } from './types';
import { DoubleMetaphoneAlgorithm } from './phonetic/doubleMetaphone';
import { ratio } from './utils';

export class TextCorrectorSimpleService implements TextCorrector {
    private vocabulary: string[] = [];
    private phoneticAlgorithm: PhoneticAlgorithm;
    private threshold: number = 0.7;
    private debug: boolean;
    private keepNgramEvaluations: boolean;
    private vocabularyPhonetic: Map<string, string>;

    constructor(
        phoneticAlgorithm: PhoneticAlgorithm | null = null,
        threshold: number = 0.7,
        debug: boolean = false,
        keepNgramEvaluations: boolean = false
    ) {
        this.phoneticAlgorithm = phoneticAlgorithm || new DoubleMetaphoneAlgorithm();
        this.threshold = threshold;
        this.debug = debug;
        this.keepNgramEvaluations = keepNgramEvaluations;

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
            const result: CorrectionResult = {
                originalText: text,
                correctedText: text,
                corrections: []
            };
            if (this.keepNgramEvaluations) {
                result.vocabularyPhoneticKeys = new Map(this.vocabularyPhonetic);
                result.ngramEvaluations = [];
            }
            return result;
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
        const ngramEvaluations: NgramEvaluation[] = [];

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

            const [bestMatch, similarity, bestMatchPhoneticKey, ngramPhoneticKey] = this.findBestMatch(ngram);

            // Store evaluation if keepNgramEvaluations is enabled
            if (this.keepNgramEvaluations) {
                ngramEvaluations.push({
                    ngram: ngram,
                    ngramPhoneticKey: ngramPhoneticKey,
                    position: [start, end],
                    vocabularyBestMatch: bestMatch,
                    vocabularyBestMatchPhoneticKey: bestMatchPhoneticKey,
                    similarityScore: similarity,
                    applied: bestMatch !== null && similarity >= this.threshold
                });
            }

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
        const correctionResult: CorrectionResult = {
            originalText: text,
            correctedText: result,
            corrections
        };

        if (this.keepNgramEvaluations) {
            correctionResult.vocabularyPhoneticKeys = new Map(this.vocabularyPhonetic);
            correctionResult.ngramEvaluations = ngramEvaluations;
        }

        return correctionResult;
    }

    private findBestMatch(text: string): [string | null, number, string | null, string] {
        if (!text || text.length < 2) {
            const textKey = this.phoneticAlgorithm.encode(text) || '';
            return [null, 0, null, textKey];
        }

        const textKey = this.phoneticAlgorithm.encode(text) || '';

        // Check for exact matches first (case-insensitive)
        const exactMatch = this.vocabulary.find(word => word.toLowerCase() === text.toLowerCase());
        if (exactMatch) {
            this.debugPrint(`Exact match found: '${text}' -> '${exactMatch}'`);
            const exactMatchKey = this.vocabularyPhonetic.get(exactMatch) || null;
            return [exactMatch, 1.0, exactMatchKey, textKey];
        }

        this.debugPrint(`\nMatching '${text}' (phonetic: ${textKey})`);

        let bestMatchAboveThreshold: string | null = null;
        let bestScoreAboveThreshold = 0;
        let bestMatchKeyAboveThreshold: string | null = null;

        let absoluteBestMatch: string | null = null;
        let absoluteBestScore = 0;
        let absoluteBestMatchKey: string | null = null;

        for (const ref of this.vocabulary) {
            const refKey = this.vocabularyPhonetic.get(ref) || '';
            const similarity = textKey && refKey ? ratio(textKey, refKey) : 0;

            // Track absolute best match (regardless of threshold)
            if (similarity > absoluteBestScore) {
                absoluteBestMatch = ref;
                absoluteBestScore = similarity;
                absoluteBestMatchKey = refKey;
            }

            // Track best match above threshold (for actual correction)
            if (similarity >= this.threshold && similarity > bestScoreAboveThreshold) {
                bestMatchAboveThreshold = ref;
                bestScoreAboveThreshold = similarity;
                bestMatchKeyAboveThreshold = refKey;
                this.debugPrint(`  Best match: '${ref}' (phonetic: ${refKey}, score: ${similarity.toFixed(3)})`);
            }
        }

        // Return best match above threshold if found, otherwise return absolute best for tracking
        if (bestMatchAboveThreshold) {
            return [bestMatchAboveThreshold, bestScoreAboveThreshold, bestMatchKeyAboveThreshold, textKey];
        } else if (this.keepNgramEvaluations && absoluteBestMatch) {
            // When keepNgramEvaluations is enabled, return absolute best match info even if below threshold
            return [absoluteBestMatch, absoluteBestScore, absoluteBestMatchKey, textKey];
        } else {
            return [null, 0, null, textKey];
        }
    }

    private debugPrint(...args: any[]): void {
        if (this.debug) {
            console.log(...args);
        }
    }
}
