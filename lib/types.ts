export interface ImageEntry {
  path: string;
  category: string;
  tags: string[];
}

export const VALID_TOPICS = [
  'animals',
  'space',
  'nature',
  'body',
  'food',
  'weather',
  'ocean',
  'transport',
  'colors',
  'mythology',
  'culture',
  'history',
  'people',
  'music',
  'feelings',
  'wonder',
] as const;

export type StoryTopic = (typeof VALID_TOPICS)[number];

export const SAFETY_FLAGS = [
  'none',
  'low-confidence',
  'sensitive-science',
  'needs-parent-review',
  'medical-adjacent',
  'too-abstract',
  'image-risk',
] as const;

export type SafetyFlag = (typeof SAFETY_FLAGS)[number];

export type AnswerSource = 'benchmark' | 'model' | 'hybrid' | 'fallback';

export type StoryLead = 'girl' | 'boy' | 'neutral';

export type WonderGuideId = 'gargi' | 'nachi';

export interface KidProfile {
  childName: string;
  childAge: number;
  storyLead: StoryLead;
  guide: WonderGuideId;
}

export interface AppProfile extends KidProfile {
  parentName: string;
  onboardingComplete: boolean;
  micPermission: 'idle' | 'granted' | 'denied' | 'unsupported';
}

export interface Story {
  id: number;
  question: string;
  story_title: string;
  story_text: string;
  fact_answer: string | null;
  narration_text: string | null;
  wonder_question: string;
  image_path: string | null;
  image_category: string | null;
  scene_tags: string | null;
  confidence: number | null;
  answer_source: AnswerSource | null;
  quality_score: number | null;
  child_name: string;
  child_age: number;
  created_at: string;
}

export interface GeneratedStory {
  title: string;
  story: string;
  wonder_question: string;
  topic: StoryTopic;
}

export interface GeneratedAnswerV1 {
  question: string;
  benchmark_id: string | null;
  topic: StoryTopic;
  fact_answer: string;
  story_title: string;
  story_text: string;
  narration_text: string;
  wonder_question: string;
  scene_tags: string[];
  activity_prompt?: string;
  safety_flags: SafetyFlag[];
  confidence: number;
  source: AnswerSource;
}

export interface FastAnswerV1 {
  question: string;
  benchmark_id: string | null;
  topic: StoryTopic;
  fact_answer: string;
  narration_text: string;
  wonder_question: string;
  scene_tags: string[];
  activity_prompt?: string;
  safety_flags: SafetyFlag[];
  confidence: number;
  source: AnswerSource;
}

export interface GenerateResponse {
  id: number;
  title: string;
  story: string;
  fact_answer: string;
  narration_text: string;
  wonder_question: string;
  image_url: string | null;
  topic: StoryTopic;
  question: string;
  scene_tags: string[];
  activity_prompt?: string;
  safety_flags: SafetyFlag[];
  confidence: number;
  source: AnswerSource;
  quality_score: number;
  saved: boolean;
  generation_mode: 'dummy' | 'ollama' | 'fallback';
  attempts: number;
  cache_hit?: boolean;
  story_status?: 'ready' | 'generating' | 'failed';
  model?: string;
  timing?: {
    cache_ms: number;
    generation_ms: number;
    image_ms: number;
    persist_ms: number;
    total_ms: number;
  };
  child_name: string;
  child_age: number;
  guide: WonderGuideId;
}

export interface FastAnswerResponse {
  id: number;
  title: string;
  story: string;
  fact_answer: string;
  narration_text: string;
  wonder_question: string;
  image_url: string | null;
  topic: StoryTopic;
  question: string;
  scene_tags: string[];
  safety_flags: SafetyFlag[];
  confidence: number;
  source: AnswerSource;
  quality_score: number;
  saved: boolean;
  generation_mode: 'dummy' | 'ollama' | 'fallback' | 'cache';
  attempts: number;
  cache_hit?: boolean;
  story_status: 'ready' | 'generating' | 'failed';
  model?: string;
  timing?: {
    cache_ms: number;
    answer_ms: number;
    image_ms: number;
    total_ms: number;
  };
  child_name: string;
  child_age: number;
  guide: WonderGuideId;
}
