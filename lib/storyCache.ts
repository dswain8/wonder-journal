import crypto from 'crypto';
import db from './db';
import { GeneratedAnswerV1, KidProfile } from './types';

const CACHE_VERSION = 'answer-v5-semantic-alignment';

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

export function buildStoryCacheKey(
  question: string,
  profile: KidProfile,
  model: string,
  mode: 'dummy' | 'ollama',
): { hash: string; normalizedQuestion: string } {
  const normalizedQuestion = normalizeQuestionForCache(question);
  const fingerprint = JSON.stringify({
    version: CACHE_VERSION,
    normalizedQuestion,
    childName: profile.childName.trim().toLowerCase(),
    childAge: profile.childAge,
    storyLead: profile.storyLead,
    guide: profile.guide,
    model,
    mode,
  });

  return {
    hash: crypto.createHash('sha256').update(fingerprint).digest('hex'),
    normalizedQuestion,
  };
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
  payload: CachedAnswerPayload,
) {
  if (payload.generationMode === 'fallback') {
    return;
  }

  if (payload.answerData.safety_flags.includes('needs-parent-review')) {
    return;
  }

  db.prepare(`
    INSERT OR REPLACE INTO story_cache (
      question_hash,
      normalized_question,
      child_age,
      response_json,
      created_at
    )
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(hash, normalizedQuestion, childAge, JSON.stringify(payload));
}
