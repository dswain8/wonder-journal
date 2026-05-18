import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = process.env.WONDER_JOURNAL_URL || 'http://127.0.0.1:3000';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:4b';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_DIR = path.join(process.cwd(), 'eval-runs', `${RUN_ID}-${MODEL.replace(/[^a-z0-9_-]+/gi, '-')}`);
const REQUIRE_LIVE = !process.argv.includes('--allow-dummy');
const LIMIT = getNumberArg('--limit');

const QUESTIONS = [
  {
    id: 'E01',
    question: 'Who is Krishna?',
    expectedTopic: 'mythology',
    expectedFactKeywords: ['krishna', 'hindu', 'flute'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'heartbeat', 'wheel'],
  },
  {
    id: 'E02',
    question: 'Who is Hanuman?',
    expectedTopic: 'mythology',
    expectedFactKeywords: ['hanuman', 'rama', 'brave'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'heartbeat', 'wheel'],
  },
  {
    id: 'E03',
    question: 'Why does Krishna play the flute?',
    expectedTopic: 'mythology',
    expectedFactKeywords: ['krishna', 'flute'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'heartbeat', 'wheel'],
  },
  {
    id: 'E04',
    question: 'Who is Ganesha?',
    expectedTopic: 'mythology',
    expectedFactKeywords: ['ganesha'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'heartbeat', 'wheel'],
  },
  {
    id: 'E05',
    question: 'Why does the moon follow our car?',
    expectedTopic: 'space',
    expectedFactKeywords: ['moon', 'far'],
    forbiddenTopics: ['body', 'food'],
    forbiddenImage: ['body-heart', 'food-kitchen'],
    forbiddenActivity: ['chest', 'taste'],
  },
  {
    id: 'E06',
    question: 'Why do stars twinkle?',
    expectedTopic: 'space',
    expectedFactKeywords: ['starlight', 'air'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'food-kitchen'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E07',
    question: 'Why is the sky blue?',
    expectedTopic: 'colors',
    expectedFactKeywords: ['sky', 'blue', 'sunlight'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E08',
    question: 'Why does the moon change shape?',
    expectedTopic: 'space',
    expectedFactKeywords: ['moon', 'lit'],
    forbiddenTopics: ['body', 'food'],
    forbiddenImage: ['body-heart', 'food-kitchen'],
    forbiddenActivity: ['chest', 'taste'],
  },
  {
    id: 'E09',
    question: 'Why do cats purr?',
    expectedTopic: 'animals',
    expectedFactKeywords: ['cats', 'purr'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E10',
    question: 'Why do peacocks dance in the rain?',
    expectedTopic: 'animals',
    expectedFactKeywords: ['peacock', 'feathers'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E11',
    question: 'Why did dinosaurs disappear?',
    expectedTopic: 'animals',
    expectedFactKeywords: ['dinosaurs'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E12',
    question: 'Why do butterflies have colors?',
    expectedTopic: 'animals',
    expectedFactKeywords: ['butterfly', 'colors'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E13',
    question: 'Why does my heart beat faster when I run?',
    expectedTopic: 'body',
    expectedFactKeywords: ['heart', 'oxygen'],
    forbiddenTopics: ['transport', 'food'],
    forbiddenImage: ['transport-rocket', 'food-kitchen'],
    forbiddenActivity: ['wheel', 'taste'],
  },
  {
    id: 'E14',
    question: 'Why do we get hiccups?',
    expectedTopic: 'body',
    expectedFactKeywords: ['hiccup'],
    forbiddenTopics: ['transport', 'food'],
    forbiddenImage: ['transport-rocket', 'food-kitchen'],
    forbiddenActivity: ['wheel', 'taste'],
  },
  {
    id: 'E15',
    question: 'Why do we dream?',
    expectedTopic: 'body',
    expectedFactKeywords: ['brain', 'sleep'],
    forbiddenTopics: ['transport', 'food'],
    forbiddenImage: ['transport-rocket', 'food-kitchen'],
    forbiddenActivity: ['wheel', 'taste'],
  },
  {
    id: 'E16',
    question: 'Where does rain go after a storm?',
    expectedTopic: 'weather',
    expectedFactKeywords: ['rainwater', 'ground'],
    forbiddenTopics: ['space', 'transport'],
    forbiddenImage: ['space-moon', 'transport-rocket'],
    forbiddenActivity: ['moon', 'wheel'],
  },
  {
    id: 'E17',
    question: 'Why do rainbows have colors?',
    expectedTopic: 'weather',
    expectedFactKeywords: ['sunlight', 'raindrops'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E18',
    question: 'Why do leaves change color?',
    expectedTopic: 'nature',
    expectedFactKeywords: ['leaves', 'color'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E19',
    question: 'How does a seed become a plant?',
    expectedTopic: 'nature',
    expectedFactKeywords: ['seed', 'plant'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E20',
    question: 'Why do people dance?',
    expectedTopic: 'music',
    expectedFactKeywords: ['dance'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E21',
    question: 'Why do we like music?',
    expectedTopic: 'music',
    expectedFactKeywords: ['music', 'sound'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E22',
    question: 'Why do we feel scared?',
    expectedTopic: 'feelings',
    expectedFactKeywords: ['scared'],
    forbiddenTopics: ['transport', 'food'],
    forbiddenImage: ['transport-rocket', 'food-kitchen'],
    forbiddenActivity: ['wheel', 'taste'],
  },
  {
    id: 'E23',
    question: 'Why do people celebrate Diwali?',
    expectedTopic: 'culture',
    expectedFactKeywords: ['diwali', 'celebrate'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E24',
    question: 'What are some famous flowers?',
    expectedTopic: 'nature',
    expectedFactKeywords: ['flowers'],
    forbiddenTopics: ['body', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket'],
    forbiddenActivity: ['chest', 'wheel'],
  },
  {
    id: 'E25',
    question: 'Why do we ask questions?',
    expectedTopic: 'wonder',
    expectedFactKeywords: ['questions'],
    forbiddenTopics: ['body', 'food', 'transport'],
    forbiddenImage: ['body-heart', 'transport-rocket', 'food-kitchen'],
    forbiddenActivity: ['chest', 'wheel', 'taste'],
  },
];

function getNumberArg(name) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`));
  if (!arg) return null;
  const value = Number(arg.slice(name.length + 1));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function requestJson(pathname, payload) {
  const startedAt = Date.now();
  let response;

  try {
    response = await fetch(`${BASE_URL}${pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      data: null,
      error: error instanceof Error ? error.message : 'Fetch failed',
    };
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return {
      ok: false,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      data: null,
      error: `Non-JSON response: ${text.slice(0, 240)}`,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    latencyMs: Date.now() - startedAt,
    data,
    error: response.ok ? null : data?.error || `HTTP ${response.status}`,
  };
}

function includesAny(value, terms = []) {
  const text = String(value || '').toLowerCase();
  return terms.some((term) => text.includes(String(term).toLowerCase()));
}

function countKeywordHits(value, terms = []) {
  const text = String(value || '').toLowerCase();
  return terms.filter((term) => text.includes(String(term).toLowerCase())).length;
}

function scoreRow(question, answerResult, storyResult) {
  const answer = answerResult.data || {};
  const story = storyResult?.data || {};
  const finalPayload = storyResult?.ok ? story : answer;
  const topic = finalPayload.topic || answer.topic || '';
  const imageUrl = finalPayload.image_url || answer.image_url || '';
  const activityPrompt = finalPayload.activity_prompt || answer.activity_prompt || '';
  const factAnswer = finalPayload.fact_answer || answer.fact_answer || '';
  const storyText = finalPayload.story || '';
  const topicOk = topic === question.expectedTopic;
  const imageOk = !includesAny(imageUrl, question.forbiddenImage);
  const activityOk = !includesAny(activityPrompt, question.forbiddenActivity);
  const forbiddenTopicOk = !question.forbiddenTopics.includes(topic);
  const factHits = countKeywordHits(factAnswer, question.expectedFactKeywords);
  const factOk = factHits >= Math.min(1, question.expectedFactKeywords.length);
  const jsonOk = answerResult.ok && Boolean(answerResult.data);
  const storyOk = !storyResult || storyResult.ok;
  const fallbackUsed =
    answer.generation_mode === 'fallback' ||
    finalPayload.generation_mode === 'fallback' ||
    (Array.isArray(finalPayload.safety_flags) &&
      finalPayload.safety_flags.includes('needs-parent-review'));
  const liveModeOk =
    !REQUIRE_LIVE ||
    answer.generation_mode === 'ollama' ||
    answer.generation_mode === 'cache';
  const semanticPass =
    topicOk && imageOk && activityOk && forbiddenTopicOk && factOk && !fallbackUsed;

  return {
    jsonOk,
    topicOk,
    imageOk,
    activityOk,
    forbiddenTopicOk,
    factOk,
    storyOk,
    fallbackUsed,
    liveModeOk,
    semanticPass,
    autoScore: [
      jsonOk,
      topicOk,
      imageOk,
      activityOk,
      forbiddenTopicOk,
      factOk,
      storyOk,
      !fallbackUsed,
      liveModeOk,
    ].filter(Boolean).length,
  };
}

async function evaluate(question) {
  const payload = {
    question: question.question,
    childName: 'Aanya',
    childAge: 5,
    storyLead: 'girl',
    guide: 'gargi',
    save: false,
  };
  const answerResult = await requestJson('/api/answer', payload);
  let storyResult = null;

  if (answerResult.ok && answerResult.data?.story_status === 'generating') {
    storyResult = await requestJson('/api/story', {
      ...payload,
      benchmark_id: answerResult.data.benchmark_id ?? null,
      topic: answerResult.data.topic,
      fact_answer: answerResult.data.fact_answer,
      narration_text: answerResult.data.narration_text,
      wonder_question: answerResult.data.wonder_question,
      scene_tags: answerResult.data.scene_tags,
      safety_flags: answerResult.data.safety_flags,
      confidence: answerResult.data.confidence,
      source: answerResult.data.source,
    });
  }

  const finalPayload = storyResult?.ok ? storyResult.data : answerResult.data;
  const checks = scoreRow(question, answerResult, storyResult);

  return {
    id: question.id,
    question: question.question,
    expected_topic: question.expectedTopic,
    model: MODEL,
    base_url: BASE_URL,
    answer_latency_ms: answerResult.latencyMs,
    story_latency_ms: storyResult?.latencyMs ?? 0,
    total_latency_ms: answerResult.latencyMs + (storyResult?.latencyMs ?? 0),
    answer_http_status: answerResult.status,
    story_http_status: storyResult?.status ?? null,
    topic: finalPayload?.topic ?? null,
    image_url: finalPayload?.image_url ?? null,
    activity_prompt: finalPayload?.activity_prompt ?? null,
    fact_answer: finalPayload?.fact_answer ?? null,
    story_title: finalPayload?.title ?? null,
    story: finalPayload?.story ?? null,
    story_summary: finalPayload?.story ? String(finalPayload.story).slice(0, 220) : '',
    cache_hit: Boolean(answerResult.data?.cache_hit || finalPayload?.cache_hit),
    generation_mode: finalPayload?.generation_mode ?? answerResult.data?.generation_mode ?? null,
    source: finalPayload?.source ?? answerResult.data?.source ?? null,
    safety_flags: finalPayload?.safety_flags ?? answerResult.data?.safety_flags ?? [],
    quality_score: finalPayload?.quality_score ?? answerResult.data?.quality_score ?? null,
    answer_error: answerResult.error,
    story_error: storyResult?.error ?? null,
    checks,
    raw_answer: answerResult.data,
    raw_story: storyResult?.data ?? null,
  };
}

function writeReports(rows) {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUT_DIR, 'results.jsonl'),
    rows.map((row) => JSON.stringify(row)).join('\n') + '\n',
  );

  const csvColumns = [
    'id',
    'question',
    'model',
    'answer_latency_ms',
    'story_latency_ms',
    'total_latency_ms',
    'expected_topic',
    'topic',
    'image_url',
    'activity_prompt',
    'generation_mode',
    'cache_hit',
    'source',
    'quality_score',
    'semantic_pass',
    'auto_score',
    'fact_answer',
  ];
  const csvRows = [
    csvColumns.join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.question,
        row.model,
        row.answer_latency_ms,
        row.story_latency_ms,
        row.total_latency_ms,
        row.expected_topic,
        row.topic,
        row.image_url,
        row.activity_prompt,
        row.generation_mode,
        row.cache_hit,
        row.source,
        row.quality_score,
        row.checks.semanticPass,
        row.checks.autoScore,
        row.fact_answer,
      ]
        .map(csvCell)
        .join(','),
    ),
  ];
  fs.writeFileSync(path.join(OUT_DIR, 'summary.csv'), csvRows.join('\n') + '\n');

  const failures = rows.filter(
    (row) =>
      !row.checks.semanticPass ||
      !row.checks.liveModeOk ||
      !row.checks.storyOk ||
      !row.checks.jsonOk,
  );
  const avgAnswerMs = Math.round(
    rows.reduce((sum, row) => sum + row.answer_latency_ms, 0) / Math.max(1, rows.length),
  );
  const avgStoryMs = Math.round(
    rows.reduce((sum, row) => sum + row.story_latency_ms, 0) / Math.max(1, rows.length),
  );
  const p95AnswerMs = percentile(rows.map((row) => row.answer_latency_ms), 0.95);
  const p95StoryMs = percentile(rows.map((row) => row.story_latency_ms), 0.95);
  const passCount = rows.length - failures.length;

  const summary = [
    '# Wonder Journal Real Ollama Eval',
    '',
    `- Generated at: ${new Date().toISOString()}`,
    `- Base URL: ${BASE_URL}`,
    `- Model: ${MODEL}`,
    `- Require live mode: ${REQUIRE_LIVE}`,
    `- Questions: ${rows.length}`,
    `- Pass: ${passCount}/${rows.length}`,
    `- Avg answer latency: ${avgAnswerMs}ms`,
    `- P95 answer latency: ${p95AnswerMs}ms`,
    `- Avg story latency: ${avgStoryMs}ms`,
    `- P95 story latency: ${p95StoryMs}ms`,
    '',
    '| # | Question | Topic | Answer ms | Story ms | Image | Activity | Pass | Notes |',
    '|---|---|---|---:|---:|---|---|---|---|',
    ...rows.map((row, index) => {
      const failedChecks = Object.entries(row.checks)
        .filter(([key, value]) => key !== 'autoScore' && value === false)
        .map(([key]) => key)
        .join(', ');
      return [
        index + 1,
        row.question,
        `${row.topic || 'n/a'} / expected ${row.expected_topic}`,
        row.answer_latency_ms,
        row.story_latency_ms,
        row.image_url || 'n/a',
        row.activity_prompt || 'n/a',
        row.checks.semanticPass && row.checks.liveModeOk ? 'yes' : 'no',
        failedChecks || '',
      ]
        .map((cell) => String(cell).replace(/\|/g, '\\|'))
        .join(' | ');
    }),
    '',
    '## What to send back',
    '',
    'Paste this file plus `failures.md` into ChatGPT/Codex, or attach the whole eval-runs folder.',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), summary + '\n');

  const failuresMd = failures.length
    ? [
        '# Failures',
        '',
        ...failures.flatMap((row) => [
          `## ${row.id}: ${row.question}`,
          '',
          `- Expected topic: ${row.expected_topic}`,
          `- Actual topic: ${row.topic}`,
          `- Answer latency: ${row.answer_latency_ms}ms`,
          `- Story latency: ${row.story_latency_ms}ms`,
          `- Image: ${row.image_url || 'n/a'}`,
          `- Activity: ${row.activity_prompt || 'n/a'}`,
          `- Generation mode: ${row.generation_mode}`,
          `- Source: ${row.source}`,
          `- Safety flags: ${(row.safety_flags || []).join(', ')}`,
          `- Failed checks: ${Object.entries(row.checks)
            .filter(([key, value]) => key !== 'autoScore' && value === false)
            .map(([key]) => key)
            .join(', ')}`,
          '',
          'Fact answer:',
          '',
          row.fact_answer || 'n/a',
          '',
          'Story summary:',
          '',
          row.story_summary || 'n/a',
          '',
        ]),
      ].join('\n')
    : '# Failures\n\nNo failures found by heuristic checks.\n';
  fs.writeFileSync(path.join(OUT_DIR, 'failures.md'), failuresMd);

  return {
    outDir: OUT_DIR,
    passCount,
    failCount: failures.length,
    avgAnswerMs,
    avgStoryMs,
    p95AnswerMs,
    p95StoryMs,
  };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[index];
}

const selectedQuestions = LIMIT ? QUESTIONS.slice(0, LIMIT) : QUESTIONS;
const rows = [];

for (const question of selectedQuestions) {
  console.log(`Evaluating ${question.id}: ${question.question}`);
  rows.push(await evaluate(question));
}

const report = writeReports(rows);

console.table(
  rows.map((row) => ({
    id: row.id,
    pass: row.checks.semanticPass && row.checks.liveModeOk,
    topic: row.topic,
    expected: row.expected_topic,
    answer_ms: row.answer_latency_ms,
    story_ms: row.story_latency_ms,
    mode: row.generation_mode,
    cache: row.cache_hit,
  })),
);

console.log(`\nEval written to ${report.outDir}`);
console.log(
  `Passed ${report.passCount}/${rows.length}. Avg answer ${report.avgAnswerMs}ms, avg story ${report.avgStoryMs}ms.`,
);

if (report.failCount > 0 || (REQUIRE_LIVE && rows.some((row) => !row.checks.liveModeOk))) {
  process.exit(1);
}
