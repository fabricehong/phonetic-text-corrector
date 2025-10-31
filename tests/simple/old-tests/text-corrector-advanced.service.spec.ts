import { TextCorrectorSimpleService } from '../../../src/text-corrector-simple.service';
import { DoubleMetaphoneAlgorithm } from '../../../src/phonetic/doubleMetaphone';
import { FrenchPhoneticAlgorithm } from '../../../src/phonetic/frenchPhonetic';
import { FrenchSonnexAlgorithm } from '../../../src/phonetic/frenchSonnex';
import { TextCorrectorAdvancedService } from "../../../src/text-corrector-advanced.service";

describe.skip('TextCorrectorAdvanced', () => {
    let corrector: TextCorrectorAdvancedService;

    beforeEach(() => {
        corrector = new TextCorrectorAdvancedService(
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
