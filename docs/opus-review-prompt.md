# Opus Review Prompt: Wonder Journal

You are Claude Opus acting as a brutally honest senior product-engineering reviewer. Review the current Wonder Journal prototype and provide concrete feedback.

## Product Context

Wonder Journal is an AI-powered curiosity journal for parents of young kids, currently built as a local-first Next.js web app.

Core loop:

1. Parent sets up family profile and kid profile.
2. Kid asks a question by voice or parent types it.
3. Local LLM via Ollama generates a short factual answer, story wrapper, narration text, visual scene tags, and follow-up wonder question.
4. App renders a kid-friendly story experience with Gargi/Nachi guide framing.
5. Successful stories save to local SQLite journal.

Target users:

- Parent: wants safe, accurate, low-friction answers to hard kid questions.
- Kid age 3-6: wants a magical, simple, voice-first answer.

Product thesis:

- This is not a chatbot.
- This is not a generic story generator.
- It is a parent-child curiosity ritual that turns real kid questions into trustworthy, warm, story-led explanations.

## Current Implementation Summary

Stack:

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3`
- Local LLM through Ollama
- Dummy mode for testing without Ollama
- Browser Web Speech API for voice input and speech synthesis narration

Important env config:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
USE_DUMMY_STORIES=true
NEXT_PUBLIC_USE_DUMMY_STORIES=true
```

Important scripts:

```bash
npm run dev -- -H 0.0.0.0
npm run build
npm run check:ollama
npm run check:ollama:generate
npm run evaluate:contract
```

Recent verification:

- `npm run build` passes.
- `npx tsc --noEmit` passes after build finishes.
- `npm run evaluate:contract` passes 25/25 in dummy mode.
- `npm run check:ollama` correctly fails in this environment because Ollama is not running.

## Files To Inspect First

Product/spec:

- `docs/v1-product-spec.md`
- `docs/ollama-v1-contract.md`
- `docs/benchmark-question-set.md`
- `docs/scene-library-plan.md`
- `docs/personal-laptop-setup.md`

AI contract/runtime:

- `lib/schemas/generated-answer-v1.schema.json`
- `lib/storyContract.ts`
- `lib/generateStory.ts`
- `lib/ollama.ts`
- `lib/dummyStory.ts`
- `lib/fallbackAnswer.ts`
- `lib/benchmarkQuestions.json`
- `scripts/evaluate-contract.mjs`
- `scripts/check-ollama.mjs`

API/storage:

- `app/api/generate/route.ts`
- `app/api/health/ollama/route.ts`
- `app/api/stories/route.ts`
- `app/api/stories/[id]/route.ts`
- `lib/db.ts`
- `lib/matchImage.ts`
- `lib/imageLibrary.ts`

Frontend journey:

- `app/page.tsx`
- `app/journal/page.tsx`
- `app/journal/[id]/page.tsx`
- `components/OnboardingFlow.tsx`
- `components/QuestionInput.tsx`
- `components/VoiceButton.tsx`
- `components/StoryCard.tsx`
- `components/StoryLoading.tsx`
- `components/DesktopStage.tsx`
- `components/WonderGuideAvatar.tsx`
- `lib/wonderGuides.ts`
- `lib/storyExperiences.ts`

## Current AI Contract

The app no longer asks the model for a loose story blob. It expects a structured `GeneratedAnswerV1` object:

```json
{
  "question": "Why does the moon follow our car?",
  "benchmark_id": "BQ-01",
  "topic": "space",
  "fact_answer": "The moon is so far away that it seems to stay with us while nearby things move quickly past.",
  "story_title": "The Moon Outside the Window",
  "story_text": "A short story-led answer...",
  "narration_text": "A shorter spoken version optimized for read aloud.",
  "wonder_question": "I wonder why the moon looks bigger near the horizon?",
  "scene_tags": ["moon", "car", "night", "trees", "distance"],
  "safety_flags": ["none"],
  "confidence": 0.96
}
```

Contract goals:

- `fact_answer` is the truth anchor.
- `story_text` is the child-friendly wrapper.
- `narration_text` powers Gargi/Nachi narration.
- `scene_tags` support reusable visual matching.
- `safety_flags` and `confidence` support fallback behavior.

The API route:

- receives question + profile
- generates dummy or Ollama answer
- retries real Ollama once on weak/bad output
- falls back to a safe non-persisted answer if needed
- matches image
- saves to SQLite unless `save=false` or fallback is used
- returns UI-ready response

## Review Questions

Please review this as if deciding whether to continue investing in this direction.

### 1. Product Direction

- Is the product thesis compelling?
- Is the parent-child curiosity ritual clear enough?
- Is the Indian mythology guide layer useful, or is it likely to distract?
- What should be cut from V1?
- What must be added before testing with a real family?

### 2. User Journey

- Does the onboarding/home/story/journal journey make sense?
- Does the current desktop-plus-mobile review shell help or hurt?
- Is the kid-facing experience too text-heavy?
- Is the narration interaction meaningful enough?
- Is the "I wonder..." follow-up valuable or forced?

### 3. AI Contract

- Is the `GeneratedAnswerV1` contract the right shape?
- Are any fields missing?
- Are any fields premature?
- Is using model-provided `confidence` a mistake?
- Should benchmark facts be injected into the prompt for known questions?
- Should the app do stronger post-generation quality checks?

### 4. Safety And Trust

- Is the blocked-word safety check too naive?
- What should happen for medical, scary, religious, death, or emotionally sensitive questions?
- Should the app save failed/fallback generations?
- What parent-facing trust signals are needed?
- What would make this unsafe for a 3-6-year-old?

### 5. Local LLM Strategy

- Is Ollama the right runtime for prototype testing?
- Is `qwen3:4b` a good first model to test?
- What should be compared against it?
- What latency/quality thresholds should we use?
- What should the model evaluation harness add beyond schema/topic checks?

### 6. Architecture And Code Quality

- Identify correctness bugs, data model issues, race conditions, or bad abstractions.
- Review SQLite usage and migrations.
- Review Next.js App Router choices.
- Review frontend/client-server boundaries.
- Review scripts and local setup ergonomics.
- Review whether dummy mode and real model mode are cleanly separated.

### 7. Highest-Leverage Next Steps

Please end with:

1. Top 5 risks, severity ranked.
2. Top 5 fixes, priority ranked.
3. A 1-week plan to make this family-testable.
4. A clear recommendation: continue, pivot, or pause.

## Output Format

Use this structure:

```markdown
# Wonder Journal Review

## Executive Verdict

## What Is Working

## Major Risks

## Product Feedback

## AI/LLM Contract Feedback

## Architecture/Code Feedback

## Safety Feedback

## Recommended Next Steps

## Continue / Pivot / Pause Recommendation
```

Be direct. Avoid generic encouragement. If something is weak, say it plainly and explain the fix.
