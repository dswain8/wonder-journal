import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = process.env.WONDER_JOURNAL_URL || 'http://127.0.0.1:3000';
const BENCHMARK_PATH = path.join(process.cwd(), 'lib', 'benchmarkQuestions.json');
const REPORT_DIR = path.join(process.cwd(), 'reports', 'contract-evals');

function parseEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...value] = line.split('=');
        return [key, value.join('=')];
      }),
  );
}

function getLimit() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));

  if (process.argv.includes('--smoke')) {
    return 5;
  }

  if (!limitArg) {
    return null;
  }

  const parsed = Number(limitArg.replace('--limit=', ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function hasContractShape(answer) {
  return (
    typeof answer.title === 'string' &&
    typeof answer.story === 'string' &&
    typeof answer.fact_answer === 'string' &&
    typeof answer.narration_text === 'string' &&
    typeof answer.wonder_question === 'string' &&
    Array.isArray(answer.scene_tags) &&
    Array.isArray(answer.safety_flags) &&
    typeof answer.confidence === 'number' &&
    typeof answer.source === 'string' &&
    typeof answer.quality_score === 'number' &&
    typeof answer.saved === 'boolean' &&
    typeof answer.generation_mode === 'string' &&
    typeof answer.attempts === 'number'
  );
}

function countSceneTagHits(actualTags, expectedTags) {
  if (!Array.isArray(actualTags) || !Array.isArray(expectedTags)) {
    return 0;
  }

  const actual = new Set(actualTags.map((tag) => String(tag).toLowerCase()));
  return expectedTags.filter((tag) => actual.has(String(tag).toLowerCase())).length;
}

async function evaluateQuestion(item) {
  const startedAt = Date.now();
  let response;

  try {
    response = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: item.question,
        childName: 'Anvita',
        childAge: 4,
        storyLead: 'girl',
        guide: 'gargi',
        save: false,
      }),
    });
  } catch (error) {
    return {
      id: item.id,
      question: item.question,
      ok: false,
      reason: error instanceof Error ? error.message : 'Fetch failed',
      latency_ms: Date.now() - startedAt,
    };
  }

  const latencyMs = Date.now() - startedAt;
  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    return {
      id: item.id,
      question: item.question,
      ok: false,
      reason: `Non-JSON response: HTTP ${response.status}`,
      responsePreview: responseText.slice(0, 240),
      latency_ms: latencyMs,
    };
  }

  if (!response.ok) {
    return {
      id: item.id,
      question: item.question,
      ok: false,
      reason: data.error || `HTTP ${response.status}`,
      latency_ms: latencyMs,
    };
  }

  const contractOk = hasContractShape(data);
  const topicOk = data.topic === item.expectedTopic;
  const sourceOk = data.source === 'benchmark' || data.source === 'hybrid';
  const fallbackUsed = data.generation_mode === 'fallback';
  const sceneTagHits = countSceneTagHits(data.scene_tags, item.sceneTags);
  const wonderOk = /^I wonder\b/.test(data.wonder_question);
  const savedOk = data.saved === false && data.id === 0;

  return {
    id: item.id,
    question: item.question,
    ok: contractOk && topicOk && sourceOk && !fallbackUsed && wonderOk && savedOk,
    contractOk,
    topicOk,
    sourceOk,
    wonderOk,
    savedOk,
    fallbackUsed,
    sceneTagHits,
    expectedTopic: item.expectedTopic,
    topic: data.topic,
    title: data.title,
    confidence: data.confidence,
    source: data.source,
    quality_score: data.quality_score,
    generation_mode: data.generation_mode,
    attempts: data.attempts,
    latency_ms: latencyMs,
    sceneTags: data.scene_tags,
    fact: data.fact_answer,
  };
}

const env = parseEnvLocal();
const benchmarks = JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'));
const limit = getLimit();
const selectedBenchmarks = limit ? benchmarks.slice(0, limit) : benchmarks;
const startedAt = Date.now();
const results = [];

for (const question of selectedBenchmarks) {
  results.push(await evaluateQuestion(question));
}

const failures = results.filter((result) => !result.ok);
const report = {
  generated_at: new Date().toISOString(),
  base_url: BASE_URL,
  use_dummy_stories: env.USE_DUMMY_STORIES === 'true',
  ollama_base_url: env.OLLAMA_BASE_URL || null,
  ollama_model: env.OLLAMA_MODEL || null,
  benchmark_count: selectedBenchmarks.length,
  duration_ms: Date.now() - startedAt,
  pass_count: results.length - failures.length,
  fail_count: failures.length,
  avg_latency_ms: Math.round(
    results.reduce((total, result) => total + result.latency_ms, 0) /
      Math.max(1, results.length),
  ),
  results,
};

fs.mkdirSync(REPORT_DIR, { recursive: true });

const reportName = `${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')}-contract-eval.json`;
const reportPath = path.join(REPORT_DIR, reportName);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.table(
  results.map((result) => ({
    id: result.id,
    ok: result.ok,
    topicOk: result.topicOk,
    sceneHits: result.sceneTagHits,
    source: result.source,
    quality: result.quality_score,
    mode: result.generation_mode,
    ms: result.latency_ms,
    confidence: result.confidence,
    topic: result.topic,
  })),
);

console.log(`\nReport written to ${reportPath}`);
console.log(
  `Passed ${report.pass_count}/${report.benchmark_count} in ${report.duration_ms}ms. Avg latency ${report.avg_latency_ms}ms.`,
);

if (failures.length > 0) {
  console.error('\nContract failures:');
  console.error(
    JSON.stringify(
      failures.map((failure) => ({
        id: failure.id,
        question: failure.question,
        contractOk: failure.contractOk,
        topicOk: failure.topicOk,
        sourceOk: failure.sourceOk,
        wonderOk: failure.wonderOk,
        savedOk: failure.savedOk,
        fallbackUsed: failure.fallbackUsed,
        expectedTopic: failure.expectedTopic,
        topic: failure.topic,
        reason: failure.reason,
      })),
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log('\nContract evaluation passed.');
