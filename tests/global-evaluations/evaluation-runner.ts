import { TextCorrector, GlobalEvaluationReport, TargetEvaluationReport, TestCaseError } from '../../src/types';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

interface ReplacementSpec {
    target: string;
    toSearch: string[];
}

interface ReplacementsYaml {
    replacements: ReplacementSpec[];
}

/**
 * Runs global evaluation on a given corrector with provided replacement specifications.
 *
 * This is the low-level function that contains the pure evaluation logic.
 * It does not perform any I/O, logging, or throwing errors.
 *
 * @param corrector - Configured TextCorrector instance (vocabulary must already be set)
 * @param replacements - Array of replacement specifications to test
 * @returns GlobalEvaluationReport with detailed results
 */
export function runGlobalEvaluation(
    corrector: TextCorrector,
    replacements: ReplacementSpec[]
): GlobalEvaluationReport {
    // Initialize target reports map
    const targetReportsMap = new Map<string, TargetEvaluationReport>();

    // Get all unique targets
    const targets = [...new Set(replacements.map(spec => spec.target))];

    // Initialize target reports for each target
    for (const target of targets) {
        targetReportsMap.set(target, {
            target: target,
            totalTests: 0,
            passed: 0,
            successRate: 0,
            errors: []
        });
    }

    // Global counters
    let totalTests = 0;
    let totalPassed = 0;

    // Loop through all replacement specs and test each variant
    for (const spec of replacements) {
        const targetReport = targetReportsMap.get(spec.target)!;

        for (const variant of spec.toSearch) {
            totalTests++;
            targetReport.totalTests++;

            // Perform correction
            const result = corrector.correctText(variant);
            const actual = result.correctedText;
            const expected = spec.target;

            // Check if correction matches expected target
            if (actual === expected) {
                totalPassed++;
                targetReport.passed++;
            } else {
                // Extract detailed info from ngramEvaluations
                // For single-word inputs, we take the evaluation for the word itself
                if (result.ngramEvaluations && result.ngramEvaluations.length > 0) {
                    // Find the evaluation for the input variant (should be the unigram)
                    const evaluation = result.ngramEvaluations.find(
                        e => e.ngram.toLowerCase() === variant.toLowerCase()
                    );

                    if (evaluation) {
                        const error: TestCaseError = {
                            input: variant,
                            inputPhoneticKey: evaluation.ngramPhoneticKey,
                            vocabularyBestMatch: evaluation.vocabularyBestMatch || '',
                            vocabularyBestMatchPhoneticKey: evaluation.vocabularyBestMatchPhoneticKey || '',
                            similarityScore: evaluation.similarityScore,
                            correctionApplied: evaluation.applied,
                            actual: actual
                        };
                        targetReport.errors.push(error);
                    }
                }
            }
        }
    }

    // Calculate success rates for each target
    for (const targetReport of targetReportsMap.values()) {
        targetReport.successRate = targetReport.totalTests > 0
            ? Math.round((targetReport.passed / targetReport.totalTests) * 100 * 10) / 10
            : 0;
    }

    // Build final report
    const report: GlobalEvaluationReport = {
        totalTests: totalTests,
        passed: totalPassed,
        successRate: totalTests > 0
            ? Math.round((totalPassed / totalTests) * 100 * 10) / 10
            : 0,
        targetReports: Array.from(targetReportsMap.values())
    };

    return report;
}

/**
 * Evaluates a dataset by name with a given corrector.
 *
 * This is the high-level orchestration function that:
 * - Builds the YAML file path from dataset name
 * - Reads and parses the YAML
 * - Extracts vocabulary and sets it on the corrector
 * - Runs the evaluation
 * - Pretty-prints the report
 * - Throws an error if any tests failed
 *
 * @param datasetName - Name of the dataset (e.g., 'correspondance' for 'correspondance-dataset')
 * @param corrector - Configured TextCorrector instance (vocabulary will be set by this function)
 * @throws Error if any tests fail
 */
export function evaluateDataset(datasetName: string, corrector: TextCorrector): void {
    // Build path from dataset name
    const yamlPath = path.join(__dirname, 'fixtures', `correspondance-dataset`, `${datasetName}.yaml`);

    // Read YAML
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(yamlContent) as ReplacementsYaml;

    // Extract vocabulary and set it on corrector
    const vocabulary = [...new Set(data.replacements.map(spec => spec.target))];
    corrector.setVocabulary(vocabulary);

    // Run evaluation
    const report = runGlobalEvaluation(corrector, data.replacements);

    // Pretty-print the report
    console.log('\n' + '='.repeat(80));
    console.log('GLOBAL EVALUATION REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(report, null, 2));
    console.log('='.repeat(80) + '\n');

    // Throw if there were any errors
    const totalFailed = report.totalTests - report.passed;
    if (totalFailed > 0) {
        throw new Error(`Global evaluation failed: ${totalFailed}/${report.totalTests} tests failed (${report.successRate}% success rate)`);
    }
}
