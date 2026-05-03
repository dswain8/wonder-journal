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
  death: ['funeral', 'funerals', 'cremate', 'cremation', 'grave', 'graves'],
  medical: [
    'sickness',
    'disease',
    'hospital',
    'medicine',
    'surgery',
    'injection',
  ],
  fear: ['scared', 'afraid', 'terrified', 'nightmare', 'monster', 'ghost'],
  religion: ['god', 'heaven', 'hell', 'soul', 'prayer', 'temple', 'religion'],
  violence: ['gun', 'knife', 'war', 'fight', 'attack', 'kill'],
};

const PLANT_LIFE_CYCLE_PATTERN =
  /\b(flower|flowers|plant|plants|leaf|leaves|tree|trees|seed|seeds|grass|fruit|vegetable|vegetables)\b/i;
const DEATH_WORD_PATTERN = /\b(die|dead|death)\b/i;

export function detectSensitiveQuestion(
  question: string,
): SensitiveQuestionResult {
  const normalized = question.toLowerCase();

  if (DEATH_WORD_PATTERN.test(normalized) && !PLANT_LIFE_CYCLE_PATTERN.test(normalized)) {
    return {
      isSensitive: true,
      category: 'death',
      safetyFlags: ['needs-parent-review'],
    };
  }

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
