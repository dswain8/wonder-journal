import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = process.env.WONDER_JOURNAL_URL || 'http://127.0.0.1:3000';
const dbPath = path.join(process.cwd(), 'wonder-journal.db');
const createdStoryIds = [];
const results = [];
const BAD_NARRATION_PATTERN =
  /what do you think|let'?s go|go on an adventure|find out|answer might be hiding|here is the simple answer/i;
const topicQuestions = [
  ['animals', 'Why do peacocks dance in the rain?'],
  ['space', 'Why do stars twinkle?'],
  ['nature', 'Why do leaves change color?'],
  ['body', 'Why do we get hiccups?'],
  ['food', 'Why does popcorn pop?'],
  ['weather', 'Where does rain go after a storm?'],
  ['ocean', 'Why are ocean waves wavy?'],
  ['transport', 'Why do airplanes stay up?'],
  ['colors', 'Why do shadows move?'],
  ['wonder', 'Why do we ask questions?'],
];

function record(name, ok, evidence) {
  results.push({ name, ok, evidence });
  const marker = ok ? 'PASS' : 'FAIL';
  console.log(`${marker} ${name} - ${evidence}`);
}

function assertCondition(condition, name, evidence) {
  record(name, Boolean(condition), evidence);
}

async function requestJson(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { parseError: text.slice(0, 240) };
  }

  return { response, data, text };
}

async function requestText(pathname) {
  const response = await fetch(`${BASE_URL}${pathname}`);
  const text = await response.text();
  return { response, text };
}

function hasWonderCardShape(data) {
  return (
    data &&
    typeof data.title === 'string' &&
    typeof data.story === 'string' &&
    typeof data.fact_answer === 'string' &&
    typeof data.narration_text === 'string' &&
    Array.isArray(data.scene_tags) &&
    Array.isArray(data.safety_flags) &&
    typeof data.saved === 'boolean' &&
    typeof data.generation_mode === 'string'
  );
}

function ensureSentenceEnding(value) {
  const trimmed = String(value || '').trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function hasAnswerFirstNarration(data) {
  return (
    typeof data?.narration_text === 'string' &&
    data.narration_text === ensureSentenceEnding(data.fact_answer) &&
    !BAD_NARRATION_PATTERN.test(data.narration_text)
  );
}

try {
  const home = await requestText('/');
  assertCondition(
    home.response.status === 200,
    'Home page responds',
    `HTTP ${home.response.status}`,
  );
  assertCondition(
    !home.text.includes('This is the LLM handoff moment') &&
      !home.text.includes('local model path') &&
      !home.text.includes('Test this build'),
    'Default home hides reviewer chrome',
    'No reviewer-only copy in default SSR HTML',
  );

  const journal = await requestText('/journal');
  assertCondition(
    journal.response.status === 200,
    'Journal page responds',
    `HTTP ${journal.response.status}`,
  );

  const invalid = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ question: '', save: false }),
  });
  assertCondition(
    invalid.response.status === 400 && invalid.data?.error === 'Question is required',
    'Generate rejects blank questions',
    `HTTP ${invalid.response.status}`,
  );

  const invalidType = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ question: { text: 'Why?' }, save: false }),
  });
  assertCondition(
    invalidType.response.status === 400 && invalidType.data?.error === 'Question is required',
    'Generate rejects non-string questions',
    `HTTP ${invalidType.response.status}`,
  );

  const htmlOnly = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ question: '<b></b>', save: false }),
  });
  assertCondition(
    htmlOnly.response.status === 400 && htmlOnly.data?.error === 'Question is required',
    'Generate rejects HTML-only questions after sanitization',
    `HTTP ${htmlOnly.response.status}`,
  );

  const tooLong = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ question: `${'why '.repeat(80)}?`, save: false }),
  });
  assertCondition(
    tooLong.response.status === 400 &&
      tooLong.data?.error === 'Please ask one short question at a time.',
    'Generate rejects overly long questions',
    `HTTP ${tooLong.response.status}`,
  );

  const moon = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Why does the moon follow our car?',
      childName: 'Aanya',
      childAge: 5,
      storyLead: 'girl',
      guide: 'gargi',
      save: false,
    }),
  });
  assertCondition(
    moon.response.status === 200 && hasWonderCardShape(moon.data),
    'Moon question returns Wonder Card contract',
    `HTTP ${moon.response.status}; mode=${moon.data?.generation_mode}; topic=${moon.data?.topic}`,
  );
  assertCondition(
    moon.data?.child_name === 'Aanya',
    'Generate sanitizes child profile fields',
    `child_name=${moon.data?.child_name}`,
  );
  assertCondition(
    moon.data?.saved === false && moon.data?.id === 0,
    'save=false does not persist',
    `saved=${moon.data?.saved}; id=${moon.data?.id}`,
  );
  assertCondition(
    moon.data?.image_url && moon.data.image_url.includes('/images/starter/space-moon-car.svg'),
    'Moon question receives starter image',
    moon.data?.image_url || 'missing image',
  );
  assertCondition(
    !JSON.stringify(moon.data).toLowerCase().includes('ting'),
    'Generated payload does not include removed narration token',
    'No "ting" token found in response JSON',
  );
  assertCondition(
    hasAnswerFirstNarration(moon.data),
    'Narration is answer-first, not a teaser',
    moon.data?.narration_text || 'missing narration',
  );

  if (moon.data?.image_url) {
    const image = await fetch(`${BASE_URL}${moon.data.image_url}`);
    assertCondition(
      image.status === 200,
      'Matched image path is fetchable',
      `${moon.data.image_url} -> HTTP ${image.status}`,
    );
  }

  const flowers = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      question: 'What are some famous flowers?',
      childName: 'Ritu',
      childAge: 5,
      guide: 'gargi',
      save: false,
    }),
  });
  assertCondition(
    flowers.response.status === 200 && hasAnswerFirstNarration(flowers.data),
    'Open-ended question narration still reads the answer first',
    flowers.data?.narration_text || `HTTP ${flowers.response.status}`,
  );

  for (const [expectedTopic, topicQuestion] of topicQuestions) {
    const topicAnswer = await requestJson('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        question: topicQuestion,
        childName: '<b>Aanya</b>',
        childAge: 5,
        guide: 'gargi',
        save: false,
      }),
    });
    const imageUrl = topicAnswer.data?.image_url;
    const imageResponse = imageUrl ? await fetch(`${BASE_URL}${imageUrl}`) : null;

    assertCondition(
      topicAnswer.response.status === 200 &&
        topicAnswer.data?.topic === expectedTopic &&
        topicAnswer.data?.child_name === 'Aanya' &&
        typeof imageUrl === 'string' &&
        imageResponse?.status === 200,
      `Topic ${expectedTopic} returns fetchable starter image`,
      `topic=${topicAnswer.data?.topic}; image=${imageUrl}; imageStatus=${imageResponse?.status ?? 'n/a'}`,
    );
  }

  const saved = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Why do peacocks dance in the rain?',
      childName: 'Aanya',
      childAge: 5,
      storyLead: 'girl',
      guide: 'gargi',
    }),
  });
  if (saved.data?.id) {
    createdStoryIds.push(saved.data.id);
  }
  assertCondition(
    saved.response.status === 200 && saved.data?.saved === true && saved.data?.id > 0,
    'Default generation persists journal entry',
    `HTTP ${saved.response.status}; saved=${saved.data?.saved}; id=${saved.data?.id}`,
  );

  const stories = await requestJson('/api/stories');
  assertCondition(
    stories.response.status === 200 && Array.isArray(stories.data),
    'Stories API returns array',
    `HTTP ${stories.response.status}; count=${Array.isArray(stories.data) ? stories.data.length : 'n/a'}`,
  );

  if (saved.data?.id) {
    const detail = await requestJson(`/api/stories/${saved.data.id}`);
    assertCondition(
      detail.response.status === 200 && detail.data?.id === saved.data.id,
      'Story detail API returns saved entry',
      `HTTP ${detail.response.status}; id=${detail.data?.id}`,
    );
  }

  const invalidStory = await requestJson('/api/stories/not-a-number');
  assertCondition(
    invalidStory.response.status === 400,
    'Story detail rejects invalid ids',
    `HTTP ${invalidStory.response.status}`,
  );

  const plantLifeCycle = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Why do flowers die?',
      childName: 'Aanya',
      childAge: 5,
      guide: 'gargi',
      save: false,
    }),
  });
  assertCondition(
    plantLifeCycle.response.status === 200 &&
      plantLifeCycle.data?.saved === false &&
      !plantLifeCycle.data?.safety_flags?.includes('needs-parent-review'),
    'Plant life-cycle question is not over-refused',
    `HTTP ${plantLifeCycle.response.status}; saved=${plantLifeCycle.data?.saved}; flags=${plantLifeCycle.data?.safety_flags?.join(',')}`,
  );

  const sensitive = await requestJson('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Why do people have funerals?',
      childName: 'Aanya',
      childAge: 5,
      guide: 'gargi',
      save: false,
    }),
  });
  assertCondition(
    sensitive.response.status === 200 &&
      sensitive.data?.saved === false &&
      sensitive.data?.safety_flags?.includes('needs-parent-review'),
    'Sensitive family question routes to parent-review fallback and does not save',
    `HTTP ${sensitive.response.status}; saved=${sensitive.data?.saved}; flags=${sensitive.data?.safety_flags?.join(',')}`,
  );

  const ollamaHealth = await requestJson('/api/health/ollama');
  assertCondition(
    [200, 503].includes(ollamaHealth.response.status) &&
      typeof ollamaHealth.data?.reachable === 'boolean' &&
      typeof ollamaHealth.data?.model === 'string',
    'Ollama health endpoint reports explicit readiness',
    `HTTP ${ollamaHealth.response.status}; reachable=${ollamaHealth.data?.reachable}; model=${ollamaHealth.data?.model}`,
  );
} finally {
  if (createdStoryIds.length && fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    const cleanup = db.prepare('DELETE FROM stories WHERE id = ?');

    for (const storyId of createdStoryIds) {
      cleanup.run(storyId);
    }

    db.close();
    console.log(`Cleaned up ${createdStoryIds.length} QA-created journal entry.`);
  }
}

const failures = results.filter((result) => !result.ok);

console.log(`\nQA smoke result: ${results.length - failures.length}/${results.length} passed.`);

if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
