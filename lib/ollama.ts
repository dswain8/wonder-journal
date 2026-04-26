const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:4b';

interface GenerateWithOllamaOptions {
  model?: string;
  format?: unknown;
  temperature?: number;
  topP?: number;
  numPredict?: number;
}

export async function generateWithOllama(
  prompt: string,
  system: string,
  options: GenerateWithOllamaOptions = {},
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      model: options.model || OLLAMA_MODEL,
      prompt,
      system,
      stream: false,
      ...(options.format ? { format: options.format } : {}),
      options: {
        temperature: options.temperature ?? 0.8,
        top_p: options.topP ?? 0.9,
        num_predict: options.numPredict ?? 600,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.response;
}

export function getOllamaConfig() {
  return {
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL,
  };
}

export async function fetchOllamaTags(): Promise<Array<{ name: string }>> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
    method: 'GET',
    cache: 'no-store',
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
