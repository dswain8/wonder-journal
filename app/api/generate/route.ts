import { NextRequest, NextResponse } from 'next/server';

import { lookupBenchmark } from '@/lib/benchmarks';
import { generateDummyAnswer } from '@/lib/dummyStory';
import { createSensitiveQuestionAnswer } from '@/lib/fallbackAnswer';
import { matchImage } from '@/lib/matchImage';
import { getLLMConfig } from '@/lib/llm';
import {
  generateFastAnswerWithTimings,
  scoreFastAnswerQuality,
} from '@/lib/progressiveAnswer';
import { detectSensitiveQuestion } from '@/lib/safety';
import { saveGeneratedStory } from '@/lib/storyPersistence';
import {
  buildFactCacheKey,
  getCachedAnswer,
  saveFactCachedAnswer,
} from '@/lib/storyCache';
import {
  validateQuestion,
  getProfileFromBody,
  nowMs,
} from '@/lib/apiRequest';
import { FastAnswerV1, GeneratedAnswerV1 } from '@/lib/types';
import { getTryTogetherPrompt } from '@/lib/activity';
import { scoreGeneratedAnswerQuality } from '@/lib/answerQuality';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const useDummyStories =
  process.env.USE_DUMMY_STORIES === 'true';

function toFactOnlyAnswer(
  answer: FastAnswerV1,
): GeneratedAnswerV1 {
  return {
    ...answer,
    story_title: 'Story coming soon',
    story_text: '',
  };
}

export async function POST(request: NextRequest) {
  const requestStartedAt = nowMs();

  try {
    const body = (await request.json()) as {
      question?: unknown;
      childName?: unknown;
      childAge?: unknown;
      storyLead?: unknown;
      guide?: unknown;
      save?: boolean;
    };

    const questionResult = validateQuestion(body.question);

    if (!questionResult.ok) {
      return NextResponse.json(
        { error: questionResult.error },
        { status: questionResult.status },
      );
    }

    const cleanQuestion = questionResult.question;
    const profile = getProfileFromBody(body);

    const shouldSave =
      typeof body.save === 'boolean'
        ? body.save
        : true;

    const model = useDummyStories
      ? 'dummy'
      : getLLMConfig().model;

    const cacheStartedAt = nowMs();

    const cacheKey = buildFactCacheKey(
      cleanQuestion,
      profile,
      model,
    );

    const cachedAnswer = await getCachedAnswer(cacheKey.hash);

    const cacheMs = nowMs() - cacheStartedAt;

    let answerData: GeneratedAnswerV1;
    let generationMode:
      | 'dummy'
      | 'llm'
      | 'fallback';

    let attempts = 1;
    let qualityScore = 0.75;
    let shouldPersist = true;
    let cacheHit = false;
    let factGenerationMs = 0;
    let parseMs = 0;

    if (cachedAnswer) {
      answerData = cachedAnswer.answerData;
      generationMode = cachedAnswer.generationMode;
      attempts = cachedAnswer.attempts;
      qualityScore = cachedAnswer.qualityScore;

      shouldPersist =
        !answerData.safety_flags.includes(
          'needs-parent-review',
        );

      cacheHit = true;
    } else {
      const sensitiveQuestion =
        detectSensitiveQuestion(cleanQuestion);

      if (sensitiveQuestion.isSensitive) {
        answerData = createSensitiveQuestionAnswer(
          cleanQuestion,
          profile,
          sensitiveQuestion.safetyFlags,
        );

        generationMode = 'fallback';
        attempts = 0;
        qualityScore = 0.2;
        shouldPersist = false;
      } else if (useDummyStories) {
        const parseStartedAt = nowMs();

        const dummy = generateDummyAnswer(
          cleanQuestion,
          profile,
        );

        parseMs = nowMs() - parseStartedAt;

        answerData = {
          ...dummy,
          story_title: 'Story coming soon',
          story_text: '',
        };

        generationMode = 'dummy';

        qualityScore =
          scoreGeneratedAnswerQuality(
            {
              ...dummy,
              story_text: dummy.story_text,
            },
            lookupBenchmark(cleanQuestion),
          );
      } else {
        const fastAnswer =
          await generateFastAnswerWithTimings(
            cleanQuestion,
            profile,
          );

        answerData = toFactOnlyAnswer(
          fastAnswer.answer,
        );

        generationMode = 'llm';

        factGenerationMs =
          fastAnswer.factGenerationMs;

        parseMs = fastAnswer.parseMs;

        qualityScore = scoreFastAnswerQuality(
          fastAnswer.answer,
        );
      }

      await saveFactCachedAnswer(
        cacheKey.hash,
        cacheKey.normalizedQuestion,
        profile.childAge,
        model,
        {
          answerData,
          generationMode,
          attempts,
          qualityScore,
        },
      );
    }

    const imageStartedAt = nowMs();

    const image = matchImage(
      cleanQuestion,
      answerData.topic,
      answerData.fact_answer,
    );

    const imageMs = nowMs() - imageStartedAt;

    const activityPrompt = getTryTogetherPrompt({
      question: cleanQuestion,
      factAnswer: answerData.fact_answer,
      topic: answerData.topic,
      sceneTags: answerData.scene_tags,
    });

    const persistStartedAt = nowMs();

    const storyId = shouldSave
      ? await saveGeneratedStory({
          question: cleanQuestion,
          answerData,
          imagePath: image?.path ?? null,
          imageCategory:
            image?.category ?? answerData.topic,
          profile,
          qualityScore,
        })
      : 0;

    const persistMs = nowMs() - persistStartedAt;

    const totalMs = nowMs() - requestStartedAt;

    const storyStatus =
      answerData.story_text.trim().length > 0 ||
      answerData.safety_flags.includes(
        'needs-parent-review',
      )
        ? 'ready'
        : 'generating';

    const meta = {
      model,
      cache_hit: cacheHit,
      cache_ms: cacheMs,
      fact_generation_ms: factGenerationMs,
      story_generation_ms: 0,
      ollama_ms: factGenerationMs,
      parse_ms: parseMs,
      total_ms: totalMs,
      generation_mode: generationMode,
      attempts,
    };

    console.info(
      'Wonder Journal fact generation timing',
      {
        question: cleanQuestion,
        normalizedQuestion:
          cacheKey.normalizedQuestion,
        model,
        generationMode,
        cacheHit,
        attempts,
        timing: {
          cache_ms: cacheMs,
          fact_generation_ms:
            factGenerationMs,
          parse_ms: parseMs,
          image_ms: imageMs,
          persist_ms: persistMs,
          total_ms: totalMs,
        },
      },
    );

    return NextResponse.json({
      id: storyId,
      title: answerData.story_title,
      story: answerData.story_text,
      fact_answer: answerData.fact_answer,
      narration_text:
        answerData.narration_text,
      wonder_question:
        answerData.wonder_question,
      image_url: image?.path ?? null,
      topic: answerData.topic,
      question: cleanQuestion,
      scene_tags: answerData.scene_tags,
      activity_prompt: activityPrompt,
      safety_flags:
        answerData.safety_flags,
      confidence: answerData.confidence,
      source: answerData.source,
      quality_score: qualityScore,
      saved: shouldSave,
      generation_mode: generationMode,
      attempts,
      cache_hit: cacheHit,
      story_status:
        storyStatus === 'generating'
          ? undefined
          : storyStatus,
      model,
      meta,
      timing: {
        cache_ms: cacheMs,
        fact_generation_ms:
          factGenerationMs,
        story_generation_ms: 0,
        ollama_ms: factGenerationMs,
        parse_ms: parseMs,
        image_ms: imageMs,
        persist_ms: persistMs,
        total_ms: totalMs,
      },
      child_name: profile.childName,
      child_age: profile.childAge,
      guide: profile.guide,
    });
  } catch (error: unknown) {
    console.error(
      'Fact generation error:',
      error,
    );

    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : '';

    if (
      message.includes('econnrefused') ||
      message.includes('fetch failed') ||
      message.includes('timed out') ||
      message.includes('timeout') ||
      message.includes('aborted')
    ) {
      return NextResponse.json(
        {
          error:
            message.includes('timed out') ||
            message.includes('timeout')
              ? 'The AI is taking too long to respond. Please try again.'
              : 'Cannot connect to the AI API. Please check your network and API key.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          'The answer got a bit jumbled. Please try again!',
      },
      { status: 422 },
    );
  }
}