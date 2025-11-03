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

    test('correction includes phonetic keys', () => {
        const text = "Hakon";
        const result = corrector.correctText(text);

        expect(result.corrections).toHaveLength(1);
        expect(result.corrections[0]).toMatchObject({
            original: 'Hakon',
            corrected: 'Hacon',
            similarityScore: expect.any(Number)
        });

        // Check that phonetic keys are present
        expect(result.corrections[0].originalTextKey).toBeDefined();
        expect(result.corrections[0].vocabularyTextKey).toBeDefined();
        expect(typeof result.corrections[0].originalTextKey).toBe('string');
        expect(typeof result.corrections[0].vocabularyTextKey).toBe('string');

        // Both should have the same phonetic key since they sound the same
        expect(result.corrections[0].originalTextKey).toBe(result.corrections[0].vocabularyTextKey);
    });

});
