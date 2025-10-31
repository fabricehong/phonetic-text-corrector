import { TextCorrectorSimpleService } from '../../src/text-corrector-simple.service';
import { FrenchSonnexAlgorithm } from '../../src/phonetic/frenchSonnex';

/**
 * Factory function to create a TextCorrector configured for global evaluation tests.
 *
 * Configuration:
 * - Algorithm: FrenchSonnexAlgorithm (French phonetic matching)
 * - Threshold: 0.7 (minimum similarity score to apply correction)
 * - Debug: false (no console logging)
 * - KeepNgramEvaluations: true (track all n-gram evaluations for detailed reporting)
 *
 * Note: The vocabulary is not set by this factory. Use setVocabulary() on the returned instance.
 *
 * @returns Configured TextCorrectorSimpleService instance without vocabulary
 */
export function createTextCorrectorForGlobalEvaluation(): TextCorrectorSimpleService {
    return new TextCorrectorSimpleService(
        new FrenchSonnexAlgorithm(),  // phoneticAlgorithm
        0.7,                           // threshold
        false,                         // debug
        true                           // keepNgramEvaluations
    );
}
