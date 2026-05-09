import { StoryTopic, VALID_TOPICS } from './types';

type TopicEvidence = {
  topic: StoryTopic;
  confidence: number;
  hits: string[];
};

const HIGH_RISK_SPECIFIC_TOPICS = new Set<StoryTopic>([
  'body',
  'food',
  'transport',
  'ocean',
]);

const TOPIC_KEYWORDS: Record<StoryTopic, string[]> = {
  animals: [
    'animal',
    'cat',
    'dog',
    'dinosaur',
    'dinosaurs',
    'peacock',
    'hanuman',
    'monkey',
    'lion',
    'fish',
    'bird',
    'purr',
  ],
  space: ['moon', 'star', 'stars', 'sun', 'planet', 'sky', 'space', 'earth'],
  nature: ['tree', 'flower', 'flowers', 'plant', 'leaf', 'seed', 'river', 'mountain'],
  body: ['heart', 'heartbeat', 'blood', 'bone', 'brain', 'lungs', 'tummy', 'hiccup'],
  food: ['food', 'popcorn', 'rice', 'milk', 'mango', 'bread', 'taste', 'cook'],
  weather: ['rain', 'rainbow', 'cloud', 'wind', 'storm', 'snow', 'weather'],
  ocean: ['ocean', 'sea', 'wave', 'waves', 'beach', 'whale', 'shark', 'tide'],
  transport: ['car', 'train', 'airplane', 'plane', 'bus', 'wheel', 'vehicle'],
  colors: ['color', 'colors', 'colour', 'red', 'blue', 'green', 'shadow', 'light'],
  mythology: [
    'krishna',
    'hanuman',
    'rama',
    'ram',
    'sita',
    'gargi',
    'nachiketa',
    'nachiket',
    'gopal',
    'flute',
    'mahabharata',
    'ramayana',
    'mythology',
    'god',
    'goddess',
    'deity',
  ],
  culture: [
    'diwali',
    'holi',
    'festival',
    'rangoli',
    'india',
    'indian',
    'temple',
    'tradition',
  ],
  history: ['history', 'king', 'queen', 'emperor', 'ancient', 'old days', 'freedom'],
  people: ['who is', 'who was', 'person', 'people', 'teacher', 'scientist', 'artist'],
  music: ['music', 'song', 'sing', 'dance', 'dancing', 'flute', 'drum', 'tabla'],
  feelings: ['feel', 'feeling', 'happy', 'sad', 'angry', 'scared', 'brave', 'love'],
  wonder: ['wonder', 'question', 'curious', 'why'],
};

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

function phraseMatches(haystack: string, phrase: string, tokens: Set<string>): boolean {
  const normalizedPhrase = phrase.toLowerCase().trim();

  if (normalizedPhrase.includes(' ')) {
    return haystack.includes(normalizedPhrase);
  }

  return tokens.has(normalizedPhrase) || tokens.has(`${normalizedPhrase}s`);
}

export function scoreTopicEvidence(
  question: string,
  factAnswer = '',
): TopicEvidence {
  const combined = `${question} ${factAnswer}`.toLowerCase();
  const tokens = tokenize(combined);
  const scored = VALID_TOPICS.map((topic) => {
    const hits = TOPIC_KEYWORDS[topic].filter((keyword) =>
      phraseMatches(combined, keyword, tokens),
    );
    const directQuestionHits = TOPIC_KEYWORDS[topic].filter((keyword) =>
      phraseMatches(question.toLowerCase(), keyword, tokenize(question)),
    );
    const score = hits.length + directQuestionHits.length * 0.8;

    return {
      topic,
      score,
      hits,
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (tokens.has('peacock') || tokens.has('peacocks')) {
    return {
      topic: 'animals',
      confidence: 0.86,
      hits: ['peacock'],
    };
  }

  if (tokens.has('leaf') || tokens.has('leaves')) {
    return {
      topic: 'nature',
      confidence: 0.78,
      hits: ['leaves'],
    };
  }

  if (
    /\bwhy\s+is\s+the\s+sky\s+blue\b/.test(combined) ||
    (tokens.has('sky') && tokens.has('blue'))
  ) {
    return {
      topic: 'colors',
      confidence: 0.82,
      hits: ['sky', 'blue', 'light'],
    };
  }

  if (!best || best.score <= 0 || best.topic === 'wonder') {
    return { topic: 'wonder', confidence: 0, hits: [] };
  }

  const secondScore = scored[1]?.score ?? 0;
  const confidence = Math.min(1, Number(((best.score - secondScore * 0.45) / 3).toFixed(2)));

  return {
    topic: best.topic,
    confidence,
    hits: best.hits,
  };
}

export function alignTopic({
  question,
  factAnswer,
  proposedTopic,
}: {
  question: string;
  factAnswer?: string;
  proposedTopic: StoryTopic;
}): { topic: StoryTopic; confidence: number; reason: string } {
  const evidence = scoreTopicEvidence(question, factAnswer);

  if (evidence.confidence >= 0.5) {
    return {
      topic: evidence.topic,
      confidence: evidence.confidence,
      reason: `semantic evidence: ${evidence.hits.join(', ')}`,
    };
  }

  if (
    proposedTopic !== 'wonder' &&
    HIGH_RISK_SPECIFIC_TOPICS.has(proposedTopic) &&
    evidence.topic !== proposedTopic
  ) {
    return {
      topic: 'wonder',
      confidence: evidence.confidence,
      reason: `low-confidence ${proposedTopic} fallback`,
    };
  }

  if (VALID_TOPICS.includes(proposedTopic) && proposedTopic !== 'wonder') {
    return {
      topic: proposedTopic,
      confidence: Math.max(0.35, evidence.confidence),
      reason: 'accepted non-risk proposed topic',
    };
  }

  return {
    topic: 'wonder',
    confidence: evidence.confidence,
    reason: 'generic wonder fallback',
  };
}

export function hasSemanticMismatch({
  question,
  factAnswer,
  topic,
}: {
  question: string;
  factAnswer?: string;
  topic: StoryTopic;
}): boolean {
  const aligned = alignTopic({ question, factAnswer, proposedTopic: topic });
  return aligned.topic !== topic && aligned.confidence >= 0.5;
}
