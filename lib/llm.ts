import OpenAI from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 20000);

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is missing. Please add it to your .env.local file.');
    }
    openaiClient = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: GROQ_TIMEOUT_MS,
    });
  }
  return openaiClient;
}

interface GenerateWithOptions {
  model?: string;
  numPredict?: number;
}

export async function generateWithLLM(
  prompt: string,
  system: string,
  options: GenerateWithOptions = {},
): Promise<string> {
  const client = getClient();
  
  try {
    const response = await client.chat.completions.create({
      model: options.model || GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.numPredict ?? 120,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned an empty response.');
    }

    return content;
  } catch (error: any) {
    if (error.name === 'APITimeoutError') {
      throw new Error(`LLM request timed out after ${GROQ_TIMEOUT_MS}ms`);
    }
    throw error;
  }
}

export function getLLMConfig() {
  return {
    model: GROQ_MODEL,
    timeoutMs: GROQ_TIMEOUT_MS,
  };
}
