import { createTextCorrectorForGlobalEvaluation } from './text-corrector-factory';
import { evaluateDataset, runGlobalEvaluation } from './evaluation-runner';
import { TextCorrector } from "../../src/types";
import path from "path";
import fs from "fs";
import * as yaml from "js-yaml";

describe('GlobalEvaluation', () => {
    test('validate all replacements from correspondance-dataset', () => {
        const corrector = createTextCorrectorForGlobalEvaluation();
        evaluateDataset('replacements', corrector);
    });
});
