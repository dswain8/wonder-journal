const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';

const OLLAMA_TIMEOUT_MS = Number(
  process.env.OLLAMA_TIMEOUT_MS || 20000,
);

interface GenerateWithOllamaOptions {
  model?: string;
}

export async function generateWithOllama(
  prompt: string,
  system: string,
  options: GenerateWithOllamaOptions = {},
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
      body: JSON.stringify({
        model: options.model || OLLAMA_MODEL,
        prompt,
        system,
        stream: false,
        options: {
          temperature: 0,
          top_p: 1,
          num_predict: 120,
        },
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(
        `Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms`,
      );
    }

    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!data.response || typeof data.response !== 'string') {
    throw new Error('Ollama returned invalid response payload');
  }

  return data.response;
}

export function getOllamaConfig() {
  return {
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  };
}

export async function fetchOllamaTags(): Promise<
  Array<{ name: string }>
> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama tags error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    models?: Array<{ name: string }>;
  };

  return data.models ?? [];
}