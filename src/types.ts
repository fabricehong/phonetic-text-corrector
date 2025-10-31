import { doubleMetaphone } from 'double-metaphone';

export interface CorrectionDetail {
    original: string;
    corrected: string;
    position: [number, number];  // [start, end]
    similarityScore: number;
}

export interface NgramEvaluation {
    ngram: string;
    ngramPhoneticKey: string;
    position: [number, number];
    vocabularyBestMatch: string | null;
    vocabularyBestMatchPhoneticKey: string | null;
    similarityScore: number;
    applied: boolean;
}

export interface CorrectionResult {
    originalText: string;
    correctedText: string;
    corrections: CorrectionDetail[];
    vocabularyPhoneticKeys?: Map<string, string>;
    ngramEvaluations?: NgramEvaluation[];
}

export interface PhoneticAlgorithm {
    encode(text: string): string;
}

export interface TextCorrector {
    setVocabulary(terms: string[]) : void;
    correctText(text: string): CorrectionResult;
}

export interface TestCaseError {
    input: string;
    inputPhoneticKey: string;
    vocabularyBestMatch: string;
    vocabularyBestMatchPhoneticKey: string;
    similarityScore: number;
    correctionApplied: boolean;
    actual: string;
}

export interface TargetEvaluationReport {
    target: string;
    totalTests: number;
    passed: number;
    successRate: number;
    errors: TestCaseError[];
}

export interface GlobalEvaluationReport {
    totalTests: number;
    passed: number;
    successRate: number;
    targetReports: TargetEvaluationReport[];
}
