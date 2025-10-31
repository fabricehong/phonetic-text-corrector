// Main service
export { TextCorrectorService } from './text-corrector.service';

// Types
export type {
    CorrectionDetail,
    CorrectionResult,
    PhoneticAlgorithm
} from './types';

// Phonetic algorithms
export { DoubleMetaphoneAlgorithm } from './doubleMetaphone';
export { FrenchSonnexAlgorithm } from './frenchSonnex';
export { FrenchPhoneticAlgorithm } from './frenchPhonetic';

// Utilities
export { ratio } from './utils';
