import { alignTopic } from './semanticAlignment';
import { StoryTopic, VALID_TOPICS } from './types';

const TRY_THIS_PROMPTS: Record<StoryTopic, string> = {
  animals: 'Look for one animal nearby or in a book. What is one clue its body gives you about how it lives?',
  space: 'Tonight, look at one close thing and one faraway thing. Move your head slowly and see which one seems to move more.',
  nature: 'Pick one leaf, flower, seed, or stone. Look closely and tell each other one tiny detail you did not notice before.',
  body: 'Put a hand on your chest, then do ten little jumps. What changed?',
  food: 'Smell one food before tasting it. Does your nose give your tongue a clue?',
  weather: 'Look out of the window and name three sky clues: cloud, wind, light, or color.',
  ocean: 'Fill a bowl with water and gently blow across it. Can you make tiny waves?',
  transport: 'Roll a toy, a ball, or a pencil. What shape helps it move?',
  colors: 'Hold something colorful near sunlight. Where do you see the brightest color?',
  mythology: 'Act out the kindest part of the story with your hands. What did the character do that felt brave or gentle?',
  culture: 'Look for one festival, food, song, or pattern your family knows. What story does it carry?',
  history: 'Pretend you found an old coin or picture. What clue tells you it came from long ago?',
  people: 'Think of one thing this person is known for. Can you act it out in one tiny pose?',
  music: 'Tap a slow beat, then a fast beat. How does your body want to move differently?',
  feelings: 'Make a face for the feeling, then take one slow breath. What changed inside your body?',
  wonder: 'Pick one thing in the room and ask: what is it made of, and why is it shaped that way?',
};

function normalizeTopic(topic: string): StoryTopic {
  return VALID_TOPICS.includes(topic as StoryTopic) ? (topic as StoryTopic) : 'wonder';
}

export function getTryTogetherPrompt({
  question,
  factAnswer,
  topic,
  sceneTags,
}: {
  question: string;
  factAnswer: string;
  topic: string;
  sceneTags?: string[] | null;
}): string {
  const combined = `${question} ${factAnswer} ${(sceneTags ?? []).join(' ')}`.toLowerCase();

  if (/\b(krishna|flute|gopal)\b/.test(combined)) {
    return 'Pretend to play a soft flute, then do one gentle twirl. What kind of music would Krishna play?';
  }

  if (/\b(hanuman|rama|ramayana)\b/.test(combined)) {
    return 'Stand tall like a brave helper, take one careful pretend leap, and say one kind thing you could do for someone.';
  }

  if (/\b(dance|dancing|music|song|sing|drum|tabla)\b/.test(combined)) {
    return 'Make a tiny rhythm with your hands, then move in a circle. What changed when the beat changed?';
  }

  const aligned = alignTopic({
    question,
    factAnswer,
    proposedTopic: normalizeTopic(topic),
  });

  return TRY_THIS_PROMPTS[aligned.topic] ?? TRY_THIS_PROMPTS.wonder;
}
