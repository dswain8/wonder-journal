import schema from './schemas/generated-answer-v1.schema.json';
import { alignTopic } from './semanticAlignment';
import {
  AnswerSource,
  FastAnswerV1,
  GeneratedAnswerV1,
  GeneratedStory,
  SAFETY_FLAGS,
  SafetyFlag,
  StoryTopic,
  VALID_TOPICS,
} from './types';

export const GENERATED_ANSWER_V1_SCHEMA = schema;

interface ValidationFallbacks {
  question: string;
  topic: StoryTopic;
  source: AnswerSource;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const raw = value[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
}

function normalizeWonderQuestion(value: string): string {
  const trimmed = value.trim();

  if (/^i wonder\b/i.test(trimmed)) {
    return `I wonder ${trimmed.replace(/^i wonder/i, '').trim()}`.trim();
  }

  return `I wonder ${trimmed.replace(/^[?.!\s]+/, '')}`.trim();
}

function normalizeSceneTag(value: string): string | null {
  const tag = value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (tag.length < 2) {
    return null;
  }

  return tag.slice(0, 32);
}

function normalizeSceneTags(value: unknown, topic: StoryTopic): string[] {
  const rawTags = Array.isArray(value) ? value : [];
  const tags = rawTags
    .filter((tag): tag is string => typeof tag === 'string')
    .map(normalizeSceneTag)
    .filter((tag): tag is string => Boolean(tag));
  const uniqueTags = Array.from(new Set(tags));

  if (uniqueTags.length >= 2) {
    return uniqueTags.slice(0, 8);
  }

  return Array.from(new Set([topic, 'curiosity', ...uniqueTags])).slice(0, 8);
}

function normalizeSafetyFlags(value: unknown): SafetyFlag[] {
  const rawFlags = Array.isArray(value) ? value : [];
  const flags = rawFlags.filter((flag): flag is SafetyFlag => {
    return (
      typeof flag === 'string' &&
      SAFETY_FLAGS.includes(flag as SafetyFlag)
    );
  });

  return flags.length > 0 ? Array.from(new Set(flags)) : ['none'];
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.75;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeSource(value: unknown, fallback: AnswerSource): AnswerSource {
  return value === 'benchmark' ||
    value === 'model' ||
    value === 'hybrid' ||
    value === 'fallback'
    ? value
    : fallback;
}

function ensureSentenceEnding(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function normalizeAnswerNarration(factAnswer: string): string {
  return ensureSentenceEnding(factAnswer);
}

function assertLength(
  label: string,
  value: string,
  minLength: number,
  maxLength: number,
) {
  if (value.length < minLength) {
    throw new Error(`${label} is too short`);
  }

  if (value.length > maxLength) {
    throw new Error(`${label} is too long`);
  }
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Small local models can still wrap JSON in text. Keep this as a recovery path,
    // but prefer strict JSON.parse whenever Ollama returns a clean object.
  }

  const jsonText = extractFirstBalancedJsonObject(trimmed);
  if (!jsonText) {
    throw new Error(
      `Model did not return a JSON object. Raw output: ${trimmed.slice(0, 1000)}`,
    );
  }

  try {
    return JSON.parse(jsonText);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown JSON parse error';
    throw new Error(
      `Failed to parse extracted JSON: ${message}. Raw output: ${trimmed.slice(0, 1000)}`,
    );
  }
}

function extractFirstBalancedJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function validateGeneratedAnswerV1(
  value: unknown,
  fallbacks: ValidationFallbacks,
): GeneratedAnswerV1 {
  if (!isRecord(value)) {
    throw new Error('Generated answer must be an object');
  }

  const topicValue = getString(value, 'topic');
  const proposedTopic = VALID_TOPICS.includes(topicValue as StoryTopic)
    ? (topicValue as StoryTopic)
    : fallbacks.topic;
  const question = getString(value, 'question') ?? fallbacks.question;
  const factAnswer = getString(value, 'fact_answer');
  const storyTitle =
    getString(value, 'story_title') ?? getString(value, 'title');
  const storyText = getString(value, 'story_text') ?? getString(value, 'story');
  const wonderQuestion = getString(value, 'wonder_question');
  const benchmarkId = getString(value, 'benchmark_id');

  if (!factAnswer) {
    throw new Error('Missing required field: fact_answer');
  }

  if (!storyTitle) {
    throw new Error('Missing required field: story_title');
  }

  if (!storyText) {
    throw new Error('Missing required field: story_text');
  }

  if (!wonderQuestion) {
    throw new Error('Missing required field: wonder_question');
  }

  const alignedTopic = alignTopic({
    question,
    factAnswer,
    proposedTopic,
  }).topic;
  const narrationText = normalizeAnswerNarration(factAnswer);

  assertLength('question', question, 3, 200);
  assertLength('fact_answer', factAnswer, 20, 220);
  assertLength('story_title', storyTitle, 4, 80);
  assertLength('story_text', storyText, 120, 1600);
  assertLength('narration_text', narrationText, 20, 500);
  assertLength('wonder_question', wonderQuestion, 12, 140);

  return {
    question,
    benchmark_id: benchmarkId && /^BQ-[0-9]{2}$/.test(benchmarkId) ? benchmarkId : null,
    topic: alignedTopic,
    fact_answer: factAnswer,
    story_title: storyTitle,
    story_text: storyText,
    narration_text: narrationText,
    wonder_question: normalizeWonderQuestion(wonderQuestion),
    scene_tags: normalizeSceneTags(value.scene_tags, alignedTopic),
    safety_flags: normalizeSafetyFlags(value.safety_flags),
    confidence: normalizeConfidence(value.confidence),
    source: normalizeSource(value.source, fallbacks.source),
  };
}

export function validateFastAnswerV1(
  value: unknown,
  fallbacks: ValidationFallbacks,
): FastAnswerV1 {
  if (!isRecord(value)) {
    throw new Error('Generated fast answer must be an object');
  }

  const topicValue = getString(value, 'topic');
  const proposedTopic = VALID_TOPICS.includes(topicValue as StoryTopic)
    ? (topicValue as StoryTopic)
    : fallbacks.topic;
  const question = getString(value, 'question') ?? fallbacks.question;
  const factAnswer = getString(value, 'fact_answer');
  const wonderQuestion =
    getString(value, 'wonder_question') ?? 'I wonder what else we can notice?';
  const benchmarkId = getString(value, 'benchmark_id');

  if (!factAnswer) {
    throw new Error('Missing required field: fact_answer');
  }

  const alignedTopic = alignTopic({
    question,
    factAnswer,
    proposedTopic,
  }).topic;
  const narrationText = normalizeAnswerNarration(factAnswer);

  assertLength('question', question, 3, 200);
  assertLength('fact_answer', factAnswer, 20, 220);
  assertLength('narration_text', narrationText, 20, 500);
  assertLength('wonder_question', wonderQuestion, 12, 140);

  return {
    question,
    benchmark_id: benchmarkId && /^BQ-[0-9]{2}$/.test(benchmarkId) ? benchmarkId : null,
    topic: alignedTopic,
    fact_answer: factAnswer,
    narration_text: narrationText,
    wonder_question: normalizeWonderQuestion(wonderQuestion),
    scene_tags: normalizeSceneTags(value.scene_tags, alignedTopic),
    safety_flags: normalizeSafetyFlags(value.safety_flags),
    confidence: normalizeConfidence(value.confidence),
    source: normalizeSource(value.source, fallbacks.source),
  };
}

export function toGeneratedStory(answer: GeneratedAnswerV1): GeneratedStory {
  return {
    title: answer.story_title,
    story: answer.story_text,
    wonder_question: answer.wonder_question,
    topic: answer.topic,
  };
}
