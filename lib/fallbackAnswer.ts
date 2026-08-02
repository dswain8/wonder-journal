import { classifyTopicByKeywords } from './generateStory';
import { validateGeneratedAnswerV1 } from './storyContract';
import {
  GeneratedAnswerV1,
  KidProfile,
  SafetyFlag,
} from './types';
import { DEFAULT_KID_PROFILE } from './wonderGuides';

export function createSafeFallbackAnswer(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): GeneratedAnswerV1 {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const guideName = profile.guide === 'nachiketh' ? 'Nachiketh' : 'Gargi';
  const topic = classifyTopicByKeywords(question);

  return validateGeneratedAnswerV1(
    {
      question,
      benchmark_id: null,
      topic,
      fact_answer:
        'This is a good question, and it deserves a careful answer before we turn it into a story.',
      story_title: 'A Careful Wonder',
      story_text: `${childName} asked a big, bright question. ${guideName} held the question gently and said, "Some wonders need one more careful look before we make the story." ${childName} nodded and kept the question safe in a tiny wonder pocket. The answer was not lost. It was waiting for a clearer clue, a simpler explanation, and a story that would be true. ${childName} smiled and said, "Wow, we can ask again!"`,
      narration_text:
        'That is a bright question. I want to answer it carefully, so let us try once more with a simpler story.',
      wonder_question: 'I wonder what clue we should look for first?',
      scene_tags: [topic, 'careful-answer', 'question', 'wonder'],
      safety_flags: ['needs-parent-review', 'low-confidence'],
      confidence: 0.25,
    },
    {
      question,
      topic,
      source: 'fallback',
    },
  );
}

export function createSensitiveQuestionAnswer(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
  safetyFlags: SafetyFlag[] = ['needs-parent-review'],
): GeneratedAnswerV1 {
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const guideName = profile.guide === 'nachiketh' ? 'Nachiketh' : 'Gargi';
  const topic = classifyTopicByKeywords(question);

  return validateGeneratedAnswerV1(
    {
      question,
      benchmark_id: null,
      topic,
      fact_answer:
        'This is an important question, and it is best answered with a grown-up sitting close.',
      story_title: 'A Wonder To Read Together',
      story_text: `${childName} asked a question that felt big and important. ${guideName} kept a soft and kind voice. "Some questions are best answered with a grown-up beside you," ${guideName} said. ${childName} held the wonder carefully, like a warm cup. The question was not too much. It simply needed a calm answer, a trusted grown-up, and a little time together. ${childName} nodded and said, "We can wonder together."`,
      narration_text:
        'That is an important wonder. Let us read this one together with a grown-up close by.',
      wonder_question: 'I wonder what we can ask a grown-up together?',
      scene_tags: [topic, 'parent-review', 'together', 'wonder'],
      safety_flags: safetyFlags,
      confidence: 0.2,
      source: 'fallback',
    },
    {
      question,
      topic,
      source: 'fallback',
    },
  );
}
