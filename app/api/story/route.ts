import { NextRequest, NextResponse } from 'next/server';
import { getTryTogetherPrompt } from '@/lib/activity';
import { scoreGeneratedAnswerQuality } from '@/lib/answerQuality';
import { lookupBenchmark } from '@/lib/benchmarks';
import { generateDummyAnswer } from '@/lib/dummyStory';
import { matchImage } from '@/lib/matchImage';
import { getLLMConfig } from '@/lib/llm';
import {
  generateFastAnswerWithTimings,
  generateStoryFromFastAnswerWithTimings,
} from '@/lib/progressiveAnswer';
import { getProfileFromBody, nowMs, validateQuestion } from '@/lib/apiRequest';
import { saveGeneratedStory } from '@/lib/storyPersistence';
import {
  buildStoryCacheKey,
  getCachedAnswer,
  saveStoryCachedAnswer,
  STORY_CACHE_PROMPT_VERSION,
} from '@/lib/storyCache';
import { FastAnswerV1 } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const useDummyStories = process.env.USE_DUMMY_STORIES === 'true';

export async function POST(request: NextRequest) {
  const requestStartedAt = nowMs();

  try {
    const body = (await request.json()) as Partial<FastAnswerV1> &
      Record<string, unknown> & { save?: boolean };
    const questionResult = validateQuestion(body.question);

    if (!questionResult.ok) {
      return NextResponse.json(
        { error: questionResult.error },
        { status: questionResult.status },
      );
    }

    const cleanQuestion = questionResult.question;
    const profile = getProfileFromBody({
      childName: body.childName,
      childAge: body.childAge,
      storyLead: body.storyLead,
      guide: body.guide,
    });
    const model = useDummyStories ? 'dummy' : getLLMConfig().model;
    const cacheStartedAt = nowMs();
    const cacheKey = buildStoryCacheKey(
      cleanQuestion,
      profile,
      model,
    );
    const cachedStory = await getCachedAnswer(cacheKey.hash);
    const cacheMs = nowMs() - cacheStartedAt;

    let answerData;
    let generationMode: 'dummy' | 'llm' | 'fallback' | 'cache' = 'llm';
    let attempts = 1;
    let qualityScore = 0.75;
    let factGenerationMs = 0;
    let storyGenerationMs = 0;
    let parseMs = 0;

    if (cachedStory) {
      answerData = cachedStory.answerData;
      generationMode = 'cache';
      attempts = cachedStory.attempts;
      qualityScore = cachedStory.qualityScore;
    } else if (useDummyStories) {
      answerData = generateDummyAnswer(cleanQuestion, profile);
      generationMode = 'dummy';
      qualityScore = scoreGeneratedAnswerQuality(
        answerData,
        lookupBenchmark(cleanQuestion),
      );
    } else {
      const generationStartedAt = nowMs();
      let fastAnswer: FastAnswerV1;

      if (
        typeof body.fact_answer === 'string' &&
        typeof body.narration_text === 'string' &&
        typeof body.topic === 'string' &&
        Array.isArray(body.scene_tags)
      ) {
        fastAnswer = {
          question: cleanQuestion,
          benchmark_id: typeof body.benchmark_id === 'string' ? body.benchmark_id : null,
          topic: body.topic as FastAnswerV1['topic'],
          fact_answer: body.fact_answer,
          narration_text: body.narration_text,
          wonder_question:
            typeof body.wonder_question === 'string'
              ? body.wonder_question
              : 'I wonder what else we can notice?',
          scene_tags: body.scene_tags.filter(
            (tag): tag is string => typeof tag === 'string',
          ),
          safety_flags: Array.isArray(body.safety_flags)
            ? body.safety_flags.filter((flag): flag is FastAnswerV1['safety_flags'][number] => typeof flag === 'string')
            : ['none'],
          confidence:
            typeof body.confidence === 'number' ? body.confidence : 0.75,
          source:
            body.source === 'benchmark' ||
            body.source === 'hybrid' ||
            body.source === 'model' ||
            body.source === 'fallback'
              ? body.source
              : 'model',
        };
      } else {
        const generatedFact = await generateFastAnswerWithTimings(
          cleanQuestion,
          profile,
        );
        fastAnswer = generatedFact.answer;
        factGenerationMs = generatedFact.factGenerationMs;
        parseMs += generatedFact.parseMs;
      }

      const generatedStory = await generateStoryFromFastAnswerWithTimings(
        fastAnswer,
        profile,
      );
      answerData = generatedStory.answer;
      storyGenerationMs = generatedStory.storyGenerationMs;
      parseMs += generatedStory.parseMs;
      const generationMs = nowMs() - generationStartedAt;
      qualityScore = scoreGeneratedAnswerQuality(
        answerData,
        lookupBenchmark(cleanQuestion),
      );
      await saveStoryCachedAnswer(
        cacheKey.hash,
        cacheKey.normalizedQuestion,
        profile.childAge,
        model,
        {
          answerData,
          generationMode: 'llm',
          attempts,
          qualityScore,
        },
      );
      storyGenerationMs = storyGenerationMs || generationMs;
    }

    const imageStartedAt = nowMs();
    const image = matchImage(cleanQuestion, answerData.topic, answerData.fact_answer);
    const imageMs = nowMs() - imageStartedAt;
    const activityPrompt = getTryTogetherPrompt({
      question: cleanQuestion,
      factAnswer: answerData.fact_answer,
      topic: answerData.topic,
      sceneTags: answerData.scene_tags,
    });
    const shouldSave =
      body.save !== false && !answerData.safety_flags.includes('needs-parent-review');
    const persistStartedAt = nowMs();
    const storyId = shouldSave
      ? await saveGeneratedStory({
          question: cleanQuestion,
          answerData,
          imagePath: image?.path ?? null,
          imageCategory: image?.category ?? answerData.topic,
          profile,
          qualityScore,
        })
      : 0;
    const persistMs = nowMs() - persistStartedAt;
    const totalMs = nowMs() - requestStartedAt;
    const meta = {
      model,
      cache_hit: generationMode === 'cache',
      cache_ms: cacheMs,
      fact_generation_ms: factGenerationMs,
      story_generation_ms: storyGenerationMs,
      ollama_ms: factGenerationMs + storyGenerationMs,
      parse_ms: parseMs,
      total_ms: totalMs,
      generation_mode: generationMode,
      attempts,
    };

    console.info('Wonder Journal story generation timing', {
      question: cleanQuestion,
      normalizedQuestion: cacheKey.normalizedQuestion,
      promptVersion: STORY_CACHE_PROMPT_VERSION,
      model,
      generationMode,
      attempts,
      timing: {
        cache_ms: cacheMs,
        fact_generation_ms: factGenerationMs,
        story_generation_ms: storyGenerationMs,
        parse_ms: parseMs,
        image_ms: imageMs,
        persist_ms: persistMs,
        total_ms: totalMs,
      },
    });

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
      activity_prompt: activityPrompt,
      safety_flags: answerData.safety_flags,
      confidence: answerData.confidence,
      source: answerData.source,
      quality_score: qualityScore,
      saved: shouldSave,
      generation_mode: generationMode,
      attempts,
      cache_hit: generationMode === 'cache',
      story_status: 'ready',
      model,
      meta,
      timing: {
        cache_ms: cacheMs,
        generation_ms: storyGenerationMs,
        fact_generation_ms: factGenerationMs,
        story_generation_ms: storyGenerationMs,
        ollama_ms: factGenerationMs + storyGenerationMs,
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
    console.error('Story continuation error:', error);
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (
      message.includes('econnrefused') ||
      message.includes('fetch failed') ||
      message.includes('timed out') ||
      message.includes('timeout') ||
      message.includes('aborted')
    ) {
      return NextResponse.json(
        { error: 'The story is taking too long. The short answer is ready.' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'The story got a bit jumbled. Please try again.' },
      { status: 422 },
    );
  }
}
