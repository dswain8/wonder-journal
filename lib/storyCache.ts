import crypto from 'crypto';
import db from './db';
import { GeneratedAnswerV1, KidProfile } from './types';



interface CachedAnswerRow {
  response_json: string;
}

export interface CachedAnswerPayload {
  answerData: GeneratedAnswerV1;
  generationMode: 'dummy' | 'ollama' | 'fallback';
  attempts: number;
  qualityScore: number;
}

export function normalizeQuestionForCache(question: string): string {
  return question
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCacheKey(
  question: string,
  profile: KidProfile,
  model: string,
  promptVersion: string,
): { hash: string; normalizedQuestion: string } {
  const normalizedQuestion = normalizeQuestionForCache(question);
  const fingerprint = JSON.stringify({
    normalized_question: normalizedQuestion,
    child_age: profile.childAge,
    model,
    prompt_version: promptVersion,
  });

  return {
    hash: crypto.createHash('sha256').update(fingerprint).digest('hex'),
    normalizedQuestion,
  };
}

export function buildFactCacheKey(
  question: string,
  profile: KidProfile,
  model: string,
): { hash: string; normalizedQuestion: string } {
  return buildCacheKey(question, profile, model, FACT_CACHE_PROMPT_VERSION);
}

export function buildStoryCacheKey(
  question: string,
  profile: KidProfile,
  model: string,
): { hash: string; normalizedQuestion: string } {
  return buildCacheKey(question, profile, model, STORY_CACHE_PROMPT_VERSION);
}

export function getCachedAnswer(hash: string): CachedAnswerPayload | null {
  const row = db
    .prepare('SELECT response_json FROM story_cache WHERE question_hash = ?')
    .get(hash) as CachedAnswerRow | undefined;

  if (!row) {
    return null;
  }

  try {
    return JSON.parse(row.response_json) as CachedAnswerPayload;
  } catch {
    db.prepare('DELETE FROM story_cache WHERE question_hash = ?').run(hash);
    return null;
  }
}

export function saveCachedAnswer(
  hash: string,
  normalizedQuestion: string,
  childAge: number,
  model: string,
  promptVersion: string,
  payload: CachedAnswerPayload,
  options: { requireStory: boolean } = { requireStory: true },
) {
  if (payload.generationMode === 'fallback') {
    return;
  }

  if (payload.answerData.safety_flags.includes('needs-parent-review')) {
    return;
  }

  if (
    !payload.answerData.fact_answer.trim() ||
    !payload.answerData.story_title.trim() ||
    !payload.answerData.narration_text.trim() ||
    (options.requireStory && !payload.answerData.story_text.trim())
  ) {
    return;
  }

  db.prepare(`
    INSERT OR REPLACE INTO story_cache (
      question_hash,
      normalized_question,
      child_age,
      model,
      prompt_version,
      response_json,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    hash,
    normalizedQuestion,
    childAge,
    model,
    promptVersion,
    JSON.stringify(payload),
  );
}

export function saveFactCachedAnswer(
  hash: string,
  normalizedQuestion: string,
  childAge: number,
  model: string,
  payload: CachedAnswerPayload,
) {
  saveCachedAnswer(
    hash,
    normalizedQuestion,
    childAge,
    model,
    FACT_CACHE_PROMPT_VERSION,
    payload,
    { requireStory: false },
  );
}

export function saveStoryCachedAnswer(
  hash: string,
  normalizedQuestion: string,
  childAge: number,
  model: string,
  payload: CachedAnswerPayload,
) {
  saveCachedAnswer(
    hash,
    normalizedQuestion,
    childAge,
    model,
    STORY_CACHE_PROMPT_VERSION,
    payload,
    { requireStory: true },
  );
}
