import { NextRequest, NextResponse } from 'next/server';
import { generateAnswer } from '@/lib/generateStory';
import { fetchOllamaTags, getOllamaConfig } from '@/lib/ollama';
import { DEFAULT_KID_PROFILE } from '@/lib/wonderGuides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const config = getOllamaConfig();
  const includeGenerationCheck =
    request.nextUrl.searchParams.get('generate') === 'true';

  try {
    const models = await fetchOllamaTags();
    const modelNames = models.map((model) => model.name);
    const modelAvailable = modelNames.some((name) => {
      return name === config.model || name.startsWith(`${config.model}:`);
    });

    if (!includeGenerationCheck) {
      return NextResponse.json({
        ok: true,
        reachable: true,
        model: config.model,
        base_url: config.baseUrl,
        model_available: modelAvailable,
        models: modelNames,
        latency_ms: Date.now() - startedAt,
      });
    }

    const generationStartedAt = Date.now();
    const answer = await generateAnswer(
      'Why does the moon follow our car?',
      DEFAULT_KID_PROFILE,
    );

    return NextResponse.json({
      ok: true,
      reachable: true,
      model: config.model,
      base_url: config.baseUrl,
      model_available: modelAvailable,
      contract_valid: true,
      topic: answer.topic,
      confidence: answer.confidence,
      generation_latency_ms: Date.now() - generationStartedAt,
      latency_ms: Date.now() - startedAt,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown Ollama health error';

    return NextResponse.json(
      {
        ok: false,
        reachable: false,
        model: config.model,
        base_url: config.baseUrl,
        error: message,
        latency_ms: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
