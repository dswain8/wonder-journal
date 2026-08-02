import { DEFAULT_KID_PROFILE, describeStoryLead } from './wonderGuides';
import { lookupBenchmark } from './benchmarks';
import {
  GeneratedAnswerV1,
  GeneratedStory,
  KidProfile,
  StoryTopic,
  VALID_TOPICS,
} from './types';
import { generateWithLLM } from './llm';
import {
  extractJsonObject,
  toGeneratedStory,
  validateGeneratedAnswerV1,
} from './storyContract';

function buildStorySystemPrompt(profile: KidProfile): string {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const childAge = Number.isFinite(profile.childAge)
    ? profile.childAge
    : DEFAULT_KID_PROFILE.childAge;
  const storyLead = describeStoryLead(profile.storyLead);

  return `You are a playful explainer for young children aged 3-5.

YOUR TASK: Write a short story-answer for a child's question. The story is not a separate add-on. It must answer the question through a fun mini-scene where the child sees the real explanation happen.

MAIN CHARACTER: A ${childAge}-year-old ${storyLead} named ${childName}. ${childName} is curious, brave, and kind.

STRICT RULES:
1. Story must be 50-100 words. No more.
2. Use very simple words. A 4-year-old must understand every sentence.
3. Start the story close to the question, not with a long setup.
4. The answer must be REAL and CORRECT — do not make up fake science.
5. End with ${childName} smiling or laughing or saying "Wow!"
6. NEVER include: scary things, death, violence, monsters, bad people, sickness, sadness.
7. Include what things look, sound, or feel like.
8. Use the child's name often. Do not assume a mother, father, or any specific family setup.
9. Make the story playful: include one tiny surprise, sound, movement, or funny image.
10. The story must explain the answer, not delay it with setup phrases.

RESPONSE FORMAT (STRICT):
- You MUST return ONLY valid JSON.
- Do NOT include markdown, explanations, or text before/after.
- Start with { and end with }.
- If you cannot comply, return {}.

JSON STRUCTURE:
{"question": "...", "benchmark_id": null, "topic": "animals|space|nature|body|food|weather|ocean|transport|colors|mythology|culture|history|people|music|feelings|wonder", "fact_answer": "...", "story_title": "...", "story_text": "...", "narration_text": "...", "wonder_question": "I wonder...", "scene_tags": ["..."], "confidence": 0.9}

IMPORTANT:
- The "topic" must be exactly one of: animals, space, nature, body, food, weather, ocean, transport, colors, mythology, culture, history, people, music, feelings, wonder.
- If unsure, use "wonder". Never guess body, food, or transport unless the question clearly asks about those.
- The "fact_answer" must be true even if the story is hidden.
- The "story_text" must be a story-answer. It should make the fact feel visual, fun, and easy to remember.
- The "narration_text" must be an answer-first spoken version of "fact_answer".
- The "narration_text" must NOT be a teaser. Do not write "what do you think", "let's go on an adventure", or "find out".
- The "narration_text" must NOT use meta phrases like "Here is the simple answer" or "The answer is".
- The "narration_text" must start by directly answering the question, not with "hello", "hey little one", or "I am".
- The "wonder_question" must start with "I wonder".
- The "scene_tags" must describe visible things an illustration could show.`;
}

export async function generateAnswer(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): Promise<GeneratedAnswerV1> {
  return (await generateAnswerWithTimings(question, profile)).answer;
}

export async function generateAnswerWithTimings(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): Promise<{
  answer: GeneratedAnswerV1;
  ollamaMs: number;
  parseMs: number;
}> {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const childAge = Number.isFinite(profile.childAge)
    ? profile.childAge
    : DEFAULT_KID_PROFILE.childAge;
  const fallbackTopic = classifyTopicByKeywords(question);
  const benchmark = lookupBenchmark(question);

  const benchmarkGuidance = benchmark
    ? `
TRUSTED BENCHMARK FACT:
- Benchmark ID: ${benchmark.id}
- Correct topic: ${benchmark.expectedTopic}
- Correct fact: ${benchmark.coreFact}
- Preferred scene tags: ${benchmark.sceneTags.join(', ')}

You MUST use the trusted fact above as the factual basis.
Do NOT contradict it.
Do NOT add extra scientific claims beyond that fact unless they are necessary and safe for age ${childAge}.`
    : '';

  const prompt = `My child ${childName} (age ${childAge}) asked: "${question}"
${benchmarkGuidance}
Write a structured answer for Wonder Journal.
Use ${childName} as the main character in the story.
Respond with ONLY valid JSON matching the required schema.`;

  const ollamaStartedAt = Date.now();
  const raw = await generateWithLLM(prompt, buildStorySystemPrompt(profile));
  const ollamaMs = Date.now() - ollamaStartedAt;

  const parseStartedAt = Date.now();
  try {
    const answer = validateGeneratedAnswerV1(extractJsonObject(raw), {
      question,
      topic: benchmark?.expectedTopic ?? fallbackTopic,
      source: benchmark ? 'hybrid' : 'model',
    });
    const parseMs = Date.now() - parseStartedAt;

    return { answer, ollamaMs, parseMs };
  } catch (error: unknown) {
    const parseMs = Date.now() - parseStartedAt;

    if (error instanceof Error && error.message.includes('safety check')) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(
      'JSON parse failed after ' +
        parseMs +
        'ms: ' +
        message +
        '. Raw: ' +
        raw.substring(0, 300),
    );
  }
}

export async function generateStory(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): Promise<GeneratedStory> {
  return toGeneratedStory(await generateAnswer(question, profile));
}

export function classifyTopicByKeywords(question: string): StoryTopic {
  const q = question.toLowerCase();
  const map: Record<string, string[]> = {
    animals: [
      'animal',
      'dog',
      'cat',
      'bird',
      'fish',
      'butterfly',
      'butterflies',
      'insect',
      'bug',
      'lion',
      'elephant',
      'dinosaur',
      'ant',
      'bee',
      'rabbit',
      'horse',
      'cow',
      'chicken',
      'frog',
      'snake',
      'monkey',
      'bear',
      'penguin',
      'dolphin',
      'spider',
      'worm',
      'tiger',
      'giraffe',
      'zebra',
      'peacock',
      'peacocks',
    ],
    space: [
      'moon',
      'star',
      'sun',
      'planet',
      'sky',
      'rocket',
      'astronaut',
      'galaxy',
      'comet',
      'night',
      'dark',
      'earth',
      'mars',
      'jupiter',
    ],
    nature: [
      'tree',
      'flower',
      'mountain',
      'river',
      'forest',
      'leaf',
      'leaves',
      'grass',
      'seed',
      'plant',
      'garden',
      'rock',
      'mud',
      'dirt',
      'volcano',
      'desert',
      'jungle',
    ],
    body: [
      'eye',
      'ear',
      'nose',
      'teeth',
      'tooth',
      'hair',
      'bone',
      'heart',
      'brain',
      'tummy',
      'stomach',
      'blood',
      'skin',
      'hand',
      'finger',
      'sleep',
      'dream',
      'sneeze',
      'hiccup',
      'cry',
      'laugh',
      'grow',
      'tall',
      'breathe',
    ],
    food: [
      'fruit',
      'vegetable',
      'apple',
      'banana',
      'cake',
      'ice cream',
      'milk',
      'bread',
      'rice',
      'cook',
      'eat',
      'taste',
      'sweet',
      'spicy',
      'chocolate',
      'pizza',
      'popcorn',
      'egg',
      'mango',
      'honey',
      'water',
    ],
    weather: [
      'rain',
      'snow',
      'cloud',
      'wind',
      'thunder',
      'lightning',
      'rainbow',
      'cold',
      'hot',
      'season',
      'winter',
      'summer',
      'spring',
      'autumn',
      'storm',
      'fog',
      'ice',
      'hail',
    ],
    ocean: [
      'ocean',
      'sea',
      'wave',
      'beach',
      'shell',
      'whale',
      'shark',
      'coral',
      'sand',
      'island',
      'underwater',
      'tide',
      'jellyfish',
      'crab',
      'starfish',
    ],
    transport: [
      'car',
      'train',
      'airplane',
      'plane',
      'bus',
      'bicycle',
      'bike',
      'boat',
      'ship',
      'truck',
      'wheel',
      'engine',
      'fly',
      'drive',
      'rocket',
      'helicopter',
    ],
    colors: [
      'color',
      'colour',
      'red',
      'blue',
      'green',
      'yellow',
      'purple',
      'orange',
      'pink',
      'black',
      'white',
      'paint',
      'light',
      'shadow',
      'music',
      'sound',
      'loud',
      'quiet',
      'sing',
      'noise',
    ],
    mythology: [
      'krishna',
      'hanuman',
      'rama',
      'ram',
      'sita',
      'gargi',
      'nachiketa',
      'nachiket',
      'mythology',
      'god',
      'goddess',
      'deity',
      'flute',
      'mahabharata',
      'ramayana',
    ],
    culture: [
      'diwali',
      'holi',
      'festival',
      'rangoli',
      'temple',
      'india',
      'indian',
      'tradition',
    ],
    history: [
      'history',
      'ancient',
      'king',
      'queen',
      'emperor',
      'freedom',
      'old days',
    ],
    people: [
      'who is',
      'who was',
      'person',
      'people',
      'scientist',
      'artist',
      'teacher',
    ],
    music: [
      'music',
      'song',
      'sing',
      'dance',
      'dancing',
      'flute',
      'drum',
      'tabla',
    ],
    feelings: [
      'feel',
      'feeling',
      'happy',
      'sad',
      'angry',
      'scared',
      'brave',
      'love',
    ],
  };

  for (const [topic, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => keywordMatches(q, keyword))) {
      return VALID_TOPICS.includes(topic as StoryTopic)
        ? (topic as StoryTopic)
        : 'wonder';
    }
  }

  return 'wonder';
}

function keywordMatches(question: string, keyword: string): boolean {
  const trimmedKeyword = keyword.trim().toLowerCase();

  if (!trimmedKeyword) {
    return false;
  }

  const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (trimmedKeyword.includes(' ')) {
    return new RegExp(`\\b${escapedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i').test(
      question,
    );
  }

  const pluralSuffix =
    trimmedKeyword.endsWith('s') || trimmedKeyword.length <= 3 ? '' : 's?';
  return new RegExp(`\\b${escapedKeyword}${pluralSuffix}\\b`, 'i').test(
    question,
  );
}
