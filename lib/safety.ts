import { SafetyFlag } from './types';

export type SensitiveQuestionCategory =
  | 'death'
  | 'medical'
  | 'fear'
  | 'religion'
  | 'violence';

interface SensitiveQuestionResult {
  isSensitive: boolean;
  category: SensitiveQuestionCategory | null;
  safetyFlags: SafetyFlag[];
}

const CATEGORY_KEYWORDS: Record<SensitiveQuestionCategory, string[]> = {
  death: ['die', 'dead', 'death', 'funeral', 'cremate', 'grave'],
  medical: [
    'blood',
    'sick',
    'sickness',
    'disease',
    'hurt',
    'pain',
    'hospital',
    'medicine',
    'surgery',
    'doctor',
    'injection',
  ],
  fear: ['scared', 'afraid', 'terrified', 'nightmare', 'monster', 'ghost'],
  religion: ['god', 'heaven', 'hell', 'soul', 'prayer', 'temple', 'religion'],
  violence: ['gun', 'knife', 'war', 'fight', 'attack', 'kill'],
};

export function detectSensitiveQuestion(
  question: string,
): SensitiveQuestionResult {
  const normalized = question.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(normalized))) {
      return {
        isSensitive: true,
        category: category as SensitiveQuestionCategory,
        safetyFlags:
          category === 'medical'
            ? ['medical-adjacent', 'needs-parent-review']
            : ['needs-parent-review'],
      };
    }
  }

  return {
    isSensitive: false,
    category: null,
    safetyFlags: ['none'],
  };
}
