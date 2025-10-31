import { TextCorrectorService } from '../../src/text-corrector.service';
import { DoubleMetaphoneAlgorithm } from '../../src/doubleMetaphone';
import { FrenchPhoneticAlgorithm } from '../../src/frenchPhonetic';
import { FrenchSonnexAlgorithm } from '../../src/frenchSonnex';

describe.skip('TextCorrector', () => {
    let corrector: TextCorrectorService;

    beforeEach(() => {
        corrector = new TextCorrectorService(
            new FrenchSonnexAlgorithm(),  // phoneticAlgorithm
            0.7,   // threshold
            0,   // stringWeight
            0.4,   // lengthWeight
            true   // debug enabled
        );

        // Set vocabulary terms
        corrector.setVocabulary(['TPG+', 'NextGen', 'Hafas']);
    });

    test('full sentence correction', () => {
        const text = "tépéjé plusse";
        const result = corrector.correctText(text);
        expect(result.correctedText).toContain('TPG+');
    });
});
