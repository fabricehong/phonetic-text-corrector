// Main service
export { TextCorrectorSimpleService } from './text-corrector-simple.service';

// Types
export type {
    CorrectionDetail,
    CorrectionResult,
    PhoneticAlgorithm
} from './types';

// Phonetic algorithms
export { DoubleMetaphoneAlgorithm } from './phonetic/doubleMetaphone';
export { FrenchSonnexAlgorithm } from './phonetic/frenchSonnex';
export { FrenchPhoneticAlgorithm } from './phonetic/frenchPhonetic';

// Utilities
export { ratio } from './utils';
