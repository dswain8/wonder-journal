const BASE_URL = process.env.WONDER_JOURNAL_URL || 'http://127.0.0.1:3000';
const includeGenerationCheck = process.argv.includes('--generate');
const url = new URL('/api/health/ollama', BASE_URL);

if (includeGenerationCheck) {
  url.searchParams.set('generate', 'true');
}

const startedAt = Date.now();
const response = await fetch(url);
const data = await response.json();

console.log(JSON.stringify(data, null, 2));

if (!response.ok || data.ok !== true) {
  process.exit(1);
}

console.log(`Ollama readiness check passed in ${Date.now() - startedAt}ms.`);
