import { doubleMetaphone } from 'double-metaphone';

export interface CorrectionDetail {
    original: string;
    corrected: string;
    position: [number, number];  // [start, end]
    similarityScore: number;
}

export interface CorrectionResult {
    originalText: string;
    correctedText: string;
    corrections: CorrectionDetail[];
}

export interface PhoneticAlgorithm {
    encode(text: string): string;
}

export interface TextCorrector {
    setVocabulary(terms: string[]) : void;
    correctText(text: string): CorrectionResult;
}
