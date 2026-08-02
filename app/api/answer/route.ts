import { NextRequest, NextResponse } from 'next/server';
import { getTryTogetherPrompt } from '@/lib/activity';
import { scoreGeneratedAnswerQuality } from '@/lib/answerQuality';
import { lookupBenchmark } from '@/lib/benchmarks';
import { generateDummyAnswer } from '@/lib/dummyStory';
import { createSensitiveQuestionAnswer } from '@/lib/fallbackAnswer';
import { matchImage } from '@/lib/matchImage';
import { getLLMConfig } from '@/lib/llm';
import { generateFastAnswer, scoreFastAnswerQuality } from '@/lib/progressiveAnswer';
import { detectSensitiveQuestion } from '@/lib/safety';
import { validateQuestion, getProfileFromBody, nowMs } from '@/lib/apiRequest';
import {
  buildFactCacheKey,
  getCachedAnswer,
  saveFactCachedAnswer,
} from '@/lib/storyCache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const useDummyStories = process.env.USE_DUMMY_STORIES === 'true';

export async function POST(request: NextRequest) {
  const requestStartedAt = nowMs();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const questionResult = validateQuestion(body.question);

    if (!questionResult.ok) {
      return NextResponse.json(
        { error: questionResult.error },
        { status: questionResult.status },
      );
    }

    const cleanQuestion = questionResult.question;
    const profile = getProfileFromBody(body);
    const model = useDummyStories ? 'dummy' : getLLMConfig().model;
    const cacheStartedAt = nowMs();
    const cacheKey = buildFactCacheKey(
      cleanQuestion,
      profile,
      model,
    );
    const cachedStory = await getCachedAnswer(cacheKey.hash);
    const cacheMs = nowMs() - cacheStartedAt;

    if (cachedStory) {
      const answerData = cachedStory.answerData;
      const imageStartedAt = nowMs();
      const image = matchImage(cleanQuestion, answerData.topic, answerData.fact_answer);
      const imageMs = nowMs() - imageStartedAt;
      const activityPrompt = getTryTogetherPrompt({
        question: cleanQuestion,
        factAnswer: answerData.fact_answer,
        topic: answerData.topic,
        sceneTags: answerData.scene_tags,
      });

      return NextResponse.json({
        id: 0,
        title: answerData.story_title,
        story: answerData.story_text,
        fact_answer: answerData.fact_answer,
        narration_text: answerData.narration_text,
        wonder_question: answerData.wonder_question,
        image_url: image?.path ?? null,
        topic: answerData.topic,
        question: cleanQuestion,
        scene_tags: answerData.scene_tags,
        activity_prompt: activityPrompt,
        safety_flags: answerData.safety_flags,
        confidence: answerData.confidence,
        source: answerData.source,
        quality_score: cachedStory.qualityScore,
        saved: false,
        generation_mode: 'cache',
        attempts: cachedStory.attempts,
        cache_hit: true,
        story_status:
          answerData.story_text.trim().length > 0 ? 'ready' : 'generating',
        model,
        timing: {
          cache_ms: cacheMs,
          answer_ms: 0,
          image_ms: imageMs,
          total_ms: nowMs() - requestStartedAt,
        },
        child_name: profile.childName,
        child_age: profile.childAge,
        guide: profile.guide,
      });
    }

    const sensitiveQuestion = detectSensitiveQuestion(cleanQuestion);
    const answerStartedAt = nowMs();
    let answerData;
    let generationMode: 'dummy' | 'llm' | 'fallback';
    let attempts = 1;
    let qualityScore = 0.75;

    if (sensitiveQuestion.isSensitive) {
      const fallback = createSensitiveQuestionAnswer(
        cleanQuestion,
        profile,
        sensitiveQuestion.safetyFlags,
      );
      answerData = fallback;
      generationMode = 'fallback';
      attempts = 0;
      qualityScore = 0.2;
    } else if (useDummyStories) {
      const dummy = generateDummyAnswer(cleanQuestion, profile);
      answerData = dummy;
      generationMode = 'dummy';
      qualityScore = scoreGeneratedAnswerQuality(dummy, lookupBenchmark(cleanQuestion));
    } else {
      const fastAnswer = await generateFastAnswer(cleanQuestion, profile);
      answerData = {
        ...fastAnswer,
        story_title: 'Story coming soon',
        story_text: '',
      };
      generationMode = 'llm';
      qualityScore = scoreFastAnswerQuality(fastAnswer);
    }

    const answerMs = nowMs() - answerStartedAt;
    const imageStartedAt = nowMs();
    const image = matchImage(cleanQuestion, answerData.topic, answerData.fact_answer);
    const imageMs = nowMs() - imageStartedAt;
    const activityPrompt = getTryTogetherPrompt({
      question: cleanQuestion,
      factAnswer: answerData.fact_answer,
      topic: answerData.topic,
      sceneTags: answerData.scene_tags,
    });
    const storyStatus =
      generationMode === 'dummy' || generationMode === 'fallback'
        ? 'ready'
        : 'generating';

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

    return NextResponse.json({
      id: 0,
      title: answerData.story_title,
      story: answerData.story_text,
      fact_answer: answerData.fact_answer,
      narration_text: answerData.narration_text,
      wonder_question: answerData.wonder_question,
      image_url: image?.path ?? null,
      topic: answerData.topic,
      question: cleanQuestion,
      scene_tags: answerData.scene_tags,
      activity_prompt: activityPrompt,
      safety_flags: answerData.safety_flags,
      confidence: answerData.confidence,
      source: answerData.source,
      quality_score: qualityScore,
      saved: false,
      generation_mode: generationMode,
      attempts,
      cache_hit: false,
      story_status: storyStatus,
      model,
      timing: {
        cache_ms: cacheMs,
        answer_ms: answerMs,
        image_ms: imageMs,
        total_ms: nowMs() - requestStartedAt,
      },
      child_name: profile.childName,
      child_age: profile.childAge,
      guide: profile.guide,
    });
  } catch (error: unknown) {
    console.error('Fast answer error:', error);
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (
      message.includes('econnrefused') ||
      message.includes('fetch failed') ||
      message.includes('timed out') ||
      message.includes('timeout') ||
      message.includes('aborted')
    ) {
      return NextResponse.json(
        {
          error: message.includes('timed out') || message.includes('timeout')
            ? 'The AI is taking too long to respond. Please try again.'
            : 'Cannot connect to the AI API. Please check your network and API key.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'The answer got a bit jumbled. Please try again!' },
      { status: 422 },
    );
  }
}
