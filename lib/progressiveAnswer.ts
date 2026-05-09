import { scoreGeneratedAnswerQuality } from './answerQuality';
import { lookupBenchmark } from './benchmarks';
import { classifyTopicByKeywords } from './generateStory';
import { generateWithOllama } from './ollama';
import {
  extractJsonObject,
  validateGeneratedAnswerV1,
  validateFastAnswerV1,
} from './storyContract';
import {
  FastAnswerV1,
  GeneratedAnswerV1,
  KidProfile,
  StoryTopic,
} from './types';
import { DEFAULT_KID_PROFILE, describeStoryLead } from './wonderGuides';

function buildFastAnswerSystemPrompt(profile: KidProfile): string {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const childAge = Number.isFinite(profile.childAge)
    ? profile.childAge
    : DEFAULT_KID_PROFILE.childAge;

  return `You answer real questions from young children aged 3-5.

YOUR TASK: Give a short, correct answer first. Do not write a story yet.

CHILD: ${childName}, age ${childAge}.

STRICT RULES:
1. Answer in 1-2 simple sentences.
2. Use real facts. Do not invent fake science.
3. Use warm, child-friendly words.
4. Do not start with "hello", "hey little one", "I am", "what do you think", or "let's go".
5. Do not tease the answer. Give the answer directly.
6. Never include scary things, violence, monsters, bad people, sickness, or sadness.

RESPONSE FORMAT (STRICT):
- Return ONLY valid JSON.
- Start with { and end with }.
- If you cannot comply, return {}.

JSON STRUCTURE:
{"question":"...","benchmark_id":null,"topic":"animals|space|nature|body|food|weather|ocean|transport|colors|mythology|culture|history|people|music|feelings|wonder","fact_answer":"...","narration_text":"...","wonder_question":"I wonder...","scene_tags":["..."],"confidence":0.9}

TOPIC RULE:
- If unsure, use "wonder". Never guess body, food, or transport unless the child clearly asks about that topic.`;
}

function buildStoryOnlySystemPrompt(profile: KidProfile): string {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const childAge = Number.isFinite(profile.childAge)
    ? profile.childAge
    : DEFAULT_KID_PROFILE.childAge;
  const storyLead = describeStoryLead(profile.storyLead);

  return `You are a playful storyteller for young children aged 3-5.

YOUR TASK: Turn a factual answer into a fun story-answer. The story must teach the same fact through a tiny visual scene.

MAIN CHARACTER: A ${childAge}-year-old ${storyLead} named ${childName}. ${childName} is curious, brave, and kind.

STRICT RULES:
1. Story must be 120-220 words.
2. Use very simple words.
3. Start close to the question. No long setup.
4. Do not add facts that contradict the provided answer.
5. Include what things look, sound, or feel like.
6. End with ${childName} smiling, laughing, or saying "Wow!"
7. Never include scary things, death, violence, monsters, bad people, sickness, or sadness.

RESPONSE FORMAT (STRICT):
- Return ONLY valid JSON.
- Start with { and end with }.
- If you cannot comply, return {}.

JSON STRUCTURE:
{"story_title":"short fun title","story_text":"the full story-answer text"}`;
}

export async function generateFastAnswer(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): Promise<FastAnswerV1> {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const fallbackTopic = classifyTopicByKeywords(question);
  const benchmark = lookupBenchmark(question);
  const benchmarkGuidance = benchmark
    ? `
TRUSTED BENCHMARK FACT:
- Benchmark ID: ${benchmark.id}
- Correct topic: ${benchmark.expectedTopic}
- Correct fact: ${benchmark.coreFact}
- Preferred scene tags: ${benchmark.sceneTags.join(', ')}

You MUST use this fact. Do not contradict it.`
    : '';

  const prompt = `My child ${childName} asked: "${question}"
${benchmarkGuidance}
Give the short answer first. Do not write the story yet.
Respond with ONLY valid JSON matching the required structure.`;

  const raw = await generateWithOllama(
    prompt,
    buildFastAnswerSystemPrompt(profile),
    { numPredict: 260 },
  );

  try {
    return validateFastAnswerV1(extractJsonObject(raw), {
      question,
      topic: benchmark?.expectedTopic ?? fallbackTopic,
      source: benchmark ? 'hybrid' : 'model',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(
      'Fast answer JSON parse failed: ' +
        message +
        '. Raw: ' +
        raw.substring(0, 300),
    );
  }
}

export async function generateStoryFromFastAnswer(
  answer: FastAnswerV1,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): Promise<GeneratedAnswerV1> {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const raw = await generateWithOllama(
    `Question: "${answer.question}"
Correct short answer: "${answer.fact_answer}"
Topic: ${answer.topic}
Scene tags: ${answer.scene_tags.join(', ')}
Child name: ${childName}

Write only the story title and story text. The story must explain the same answer.`,
    buildStoryOnlySystemPrompt(profile),
    { numPredict: 520 },
  );

  try {
    const story = extractJsonObject(raw);
    return validateGeneratedAnswerV1(
      {
        ...(typeof story === 'object' && story !== null ? story : {}),
        question: answer.question,
        benchmark_id: answer.benchmark_id,
        topic: answer.topic,
        fact_answer: answer.fact_answer,
        narration_text: answer.narration_text,
        wonder_question: answer.wonder_question,
        scene_tags: answer.scene_tags,
        safety_flags: answer.safety_flags,
        confidence: answer.confidence,
        source: answer.source,
      },
      {
        question: answer.question,
        topic: answer.topic as StoryTopic,
        source: answer.source,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(
      'Story JSON parse failed: ' +
        message +
        '. Raw: ' +
        raw.substring(0, 300),
    );
  }
}

export function scoreFastAnswerQuality(answer: FastAnswerV1): number {
  const syntheticAnswer: GeneratedAnswerV1 = {
    ...answer,
    story_title: 'Story coming soon',
    story_text: `${answer.fact_answer} ${answer.fact_answer}`,
  };

  return scoreGeneratedAnswerQuality(syntheticAnswer, lookupBenchmark(answer.question));
}
