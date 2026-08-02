import { KidProfile, StoryLead, WonderGuideId } from './types';
import { DEFAULT_KID_PROFILE } from './wonderGuides';

export const MAX_QUESTION_LENGTH = 220;

export function nowMs() {
  return Date.now();
}

export function cleanText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function getProfileFromBody(body: {
  childName?: unknown;
  childAge?: unknown;
  storyLead?: unknown;
  guide?: unknown;
}): KidProfile {
  const cleanedChildName =
    typeof body.childName === 'string' ? cleanText(body.childName).slice(0, 24) : '';

  return {
    childName: cleanedChildName || DEFAULT_KID_PROFILE.childName,
    childAge:
      typeof body.childAge === 'number' && body.childAge >= 3 && body.childAge <= 8
        ? body.childAge
        : DEFAULT_KID_PROFILE.childAge,
    storyLead:
      body.storyLead === 'boy' ||
      body.storyLead === 'neutral' ||
      body.storyLead === 'girl'
        ? (body.storyLead as StoryLead)
        : DEFAULT_KID_PROFILE.storyLead,
    guide:
      body.guide === 'nachiketh' || body.guide === 'gargi'
        ? (body.guide as WonderGuideId)
        : DEFAULT_KID_PROFILE.guide,
  };
}

export function validateQuestion(question: unknown):
  | { ok: true; question: string }
  | { ok: false; error: string; status: number } {
  if (!question || typeof question !== 'string') {
    return { ok: false, error: 'Question is required', status: 400 };
  }

  const cleanQuestion = cleanText(question);

  if (cleanQuestion.length === 0) {
    return { ok: false, error: 'Question is required', status: 400 };
  }

  if (cleanQuestion.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      error: 'Please ask one short question at a time.',
      status: 400,
    };
  }

  return { ok: true, question: cleanQuestion };
}
