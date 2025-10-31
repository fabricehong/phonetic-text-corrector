import { TextCorrectorService } from '../src/text-corrector.service';
import { FrenchSonnexAlgorithm } from '../src/frenchSonnex';

describe('TextCorrectorService', () => {
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

    test('simple correction', () => {
        const text = "tépéjé plusse";
        const result = corrector.correctText(text);
        expect(result.correctedText).toContain('TPG+');
    });

    test('complex correction', () => {
        const text = "next jen and hafas tépéjé plusse";
        const result = corrector.correctText(text);
        expect(result.correctedText).toContain('NextGen and Hafas TPG+');
    });

    test('should not match', () => {
        const shoudlntMatchPairs = [
            ['Covariance', 'ça fait onze', ],
            ['GestE', 'Qui est', ],
        ]

        for (const pair of shoudlntMatchPairs) {
            const voc = pair[0];
            const toCorrect = pair[1];
            corrector.setVocabulary([voc]);
            const result = corrector.correctText(toCorrect);
            expect(result.correctedText).toEqual(toCorrect);
        }
    });

    test('should match', () => {
        const shoudlntMatchPairs = [
            ['FAIRTIQ', 'fer tic', ],
        ]

        for (const pair of shoudlntMatchPairs) {
            const voc = pair[0];
            const toCorrect = pair[1];
            corrector.setVocabulary([voc]);
            const result = corrector.correctText(toCorrect);
            expect(result.correctedText).not.toEqual(toCorrect);
        }
    });
});
