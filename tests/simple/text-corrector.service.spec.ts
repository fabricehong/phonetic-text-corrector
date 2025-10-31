import { TextCorrectorSimpleService } from '../../src/text-corrector-simple.service';
import { FrenchSonnexAlgorithm } from '../../src/phonetic/frenchSonnex';

describe('TextCorrectorService', () => {
    let corrector: TextCorrectorSimpleService;

    beforeEach(() => {
        corrector = new TextCorrectorSimpleService(
            new FrenchSonnexAlgorithm(),  // phoneticAlgorithm
            0.7,   // threshold
            true,   // stringWeight
        );

        // Set vocabulary terms
        corrector.setVocabulary(['Hacon']);
    });

    test('simple correction', () => {
        const text = "Hakon";
        const result = corrector.correctText(text);
        expect(result.correctedText).toContain('Hacon');
    });

});
