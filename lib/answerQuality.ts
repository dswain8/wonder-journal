import { BenchmarkQuestion } from './benchmarks';
import { GeneratedAnswerV1 } from './types';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'because',
  'be',
  'by',
  'can',
  'from',
  'in',
  'into',
  'is',
  'it',
  'like',
  'of',
  'or',
  'our',
  'so',
  'that',
  'the',
  'their',
  'to',
  'us',
  'we',
  'when',
  'while',
  'with',
]);

function keywords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function overlapScore(actual: string, expected: string): number {
  const expectedWords = Array.from(new Set(keywords(expected)));

  if (expectedWords.length === 0) {
    return 1;
  }

  const actualWords = new Set(keywords(actual));
  const hits = expectedWords.filter((word) => actualWords.has(word)).length;

  return hits / expectedWords.length;
}

export function scoreGeneratedAnswerQuality(
  answer: GeneratedAnswerV1,
  benchmark: BenchmarkQuestion | null,
): number {
  let score = 0;

  if (answer.fact_answer.length >= 45 && answer.fact_answer.length <= 260) {
    score += 0.22;
  }

  if (answer.story_text.length > answer.narration_text.length) {
    score += 0.18;
  }

  if (/^I wonder\b/.test(answer.wonder_question)) {
    score += 0.14;
  }

  if (answer.scene_tags.length >= 2) {
    score += 0.14;
  }

  if (!answer.safety_flags.includes('needs-parent-review')) {
    score += 0.12;
  }

  if (benchmark) {
    score += Math.min(
      0.2,
      overlapScore(answer.fact_answer, benchmark.coreFact) * 0.2,
    );
  } else {
    score += 0.12;
  }

  return Number(score.toFixed(2));
}

export function isLowQualityAnswer(
  answer: GeneratedAnswerV1,
  benchmark: BenchmarkQuestion | null,
): boolean {
  if (
    answer.safety_flags.includes('needs-parent-review') ||
    answer.safety_flags.includes('low-confidence')
  ) {
    return true;
  }

  return scoreGeneratedAnswerQuality(answer, benchmark) < 0.62;
}
