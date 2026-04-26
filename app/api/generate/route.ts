import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { scoreGeneratedAnswerQuality, isLowQualityAnswer } from '@/lib/answerQuality';
import { lookupBenchmark } from '@/lib/benchmarks';
import { generateDummyAnswer } from '@/lib/dummyStory';
import {
  createSafeFallbackAnswer,
  createSensitiveQuestionAnswer,
} from '@/lib/fallbackAnswer';
import { generateAnswer } from '@/lib/generateStory';
import { matchImage } from '@/lib/matchImage';
import { detectSensitiveQuestion } from '@/lib/safety';
import {
  GeneratedAnswerV1,
  KidProfile,
  StoryLead,
  WonderGuideId,
} from '@/lib/types';
import { DEFAULT_KID_PROFILE } from '@/lib/wonderGuides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const useDummyStories = process.env.USE_DUMMY_STORIES === 'true';

async function generateAnswerWithRetry(
  question: string,
  profile: KidProfile,
): Promise<{
  answerData: GeneratedAnswerV1;
  generationMode: 'dummy' | 'ollama' | 'fallback';
  attempts: number;
  shouldPersist: boolean;
  qualityScore: number;
}> {
  const benchmark = lookupBenchmark(question);
  const sensitiveQuestion = detectSensitiveQuestion(question);

  if (sensitiveQuestion.isSensitive) {
    const answerData = createSensitiveQuestionAnswer(
      question,
      profile,
      sensitiveQuestion.safetyFlags,
    );

    return {
      answerData,
      generationMode: 'fallback',
      attempts: 0,
      shouldPersist: false,
      qualityScore: 0.2,
    };
  }

  if (useDummyStories) {
    const answerData = generateDummyAnswer(question, profile);

    return {
      answerData,
      generationMode: 'dummy',
      attempts: 1,
      shouldPersist: !answerData.safety_flags.includes('needs-parent-review'),
      qualityScore: scoreGeneratedAnswerQuality(answerData, benchmark),
    };
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const answerData = await generateAnswer(question, profile);
      const qualityScore = scoreGeneratedAnswerQuality(answerData, benchmark);

      if (isLowQualityAnswer(answerData, benchmark)) {
        throw new Error(`Generated answer failed server quality checks: ${qualityScore}`);
      }

      return {
        answerData,
        generationMode: 'ollama',
        attempts: attempt,
        shouldPersist: !answerData.safety_flags.includes('needs-parent-review'),
        qualityScore,
      };
    } catch (error) {
      lastError = error;
      console.warn(`Generation attempt ${attempt} failed`, error);
    }
  }

  console.error('Generation fallback used:', lastError);

  return {
    answerData: createSafeFallbackAnswer(question, profile),
    generationMode: 'fallback',
    attempts: 2,
    shouldPersist: false,
    qualityScore: 0.2,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { question, childName, childAge, storyLead, guide, save } =
      (await request.json()) as Partial<KidProfile> & {
        question?: string;
        save?: boolean;
      };

    if (
      !question ||
      typeof question !== 'string' ||
      question.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 },
      );
    }

    const cleanQuestion = question.trim().replace(/<[^>]*>/g, '');
    const profile: KidProfile = {
      childName:
        typeof childName === 'string' && childName.trim()
          ? childName.trim().replace(/<[^>]*>/g, '')
          : DEFAULT_KID_PROFILE.childName,
      childAge:
        typeof childAge === 'number' && childAge >= 3 && childAge <= 8
          ? childAge
          : DEFAULT_KID_PROFILE.childAge,
      storyLead:
        storyLead === 'boy' || storyLead === 'neutral' || storyLead === 'girl'
          ? (storyLead as StoryLead)
          : DEFAULT_KID_PROFILE.storyLead,
      guide:
        guide === 'nachi' || guide === 'gargi'
          ? (guide as WonderGuideId)
          : DEFAULT_KID_PROFILE.guide,
    };

    const {
      answerData,
      generationMode,
      attempts,
      shouldPersist,
      qualityScore,
    } = await generateAnswerWithRetry(cleanQuestion, profile);
    const image = matchImage(cleanQuestion, answerData.topic);

    const shouldSave = save !== false && shouldPersist;
    const storyId = shouldSave
      ? Number(
          db
            .prepare(`
              INSERT INTO stories (
                question,
                story_title,
                story_text,
                fact_answer,
                narration_text,
                wonder_question,
                image_path,
                image_category,
                scene_tags,
                confidence,
                answer_source,
                quality_score,
                child_name,
                child_age
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
              cleanQuestion,
              answerData.story_title,
              answerData.story_text,
              answerData.fact_answer,
              answerData.narration_text,
              answerData.wonder_question,
              image?.path ?? null,
              image?.category ?? answerData.topic,
              JSON.stringify(answerData.scene_tags),
              answerData.confidence,
              answerData.source,
              qualityScore,
              profile.childName,
              profile.childAge,
            ).lastInsertRowid,
        )
      : 0;

    return NextResponse.json({
      id: storyId,
      title: answerData.story_title,
      story: answerData.story_text,
      fact_answer: answerData.fact_answer,
      narration_text: answerData.narration_text,
      wonder_question: answerData.wonder_question,
      image_url: image?.path ?? null,
      topic: answerData.topic,
      question: cleanQuestion,
      scene_tags: answerData.scene_tags,
      safety_flags: answerData.safety_flags,
      confidence: answerData.confidence,
      source: answerData.source,
      quality_score: qualityScore,
      saved: shouldSave,
      generation_mode: generationMode,
      attempts,
      child_name: profile.childName,
      child_age: profile.childAge,
      guide: profile.guide,
    });
  } catch (error: unknown) {
    console.error('Generation error:', error);

    if (
      error instanceof Error &&
      (error.message.includes('ECONNREFUSED') ||
        error.message.includes('fetch failed'))
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot connect to Ollama. Please make sure Ollama is running (ollama serve).',
        },
        { status: 503 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes('safety check')
    ) {
      return NextResponse.json(
        { error: 'The story fairy needs another try! Please ask again.' },
        { status: 422 },
      );
    }

    if (error instanceof Error && error.message.includes('JSON parse')) {
      return NextResponse.json(
        { error: 'The story got a bit jumbled. Please try again!' },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
