# Wonder Journal Ollama V1 Contract

This document describes the structured answer contract used between Wonder Journal and the local Ollama model.

Related implementation files:

- [generated-answer-v1.schema.json](../lib/schemas/generated-answer-v1.schema.json)
- [storyContract.ts](../lib/storyContract.ts)
- [generateStory.ts](../lib/generateStory.ts)
- [ollama.ts](../lib/ollama.ts)

## 1. Why The Contract Exists

Wonder Journal should not treat the model response as one loose blob of prose.

The app needs separate pieces so the UI can answer the child clearly:

- a short factual answer
- a story answer
- read-aloud narration
- visual scene tags
- safety and provenance metadata
- journal persistence fields

The contract makes the model output predictable enough for the product to render, validate, test, and save.

## 2. Current Runtime Decision

The app does **not** send Ollama a `format` field today.

That is intentional.

For the current local setup with `qwen3:4b`, the most reliable path is:

1. Prompt the model to return only JSON.
2. Keep generation deterministic with `temperature: 0` and `top_p: 1`.
3. Parse strict JSON first.
4. If the model wraps JSON in extra text, recover the first balanced `{ ... }` object.
5. Validate and normalize the object locally before rendering or saving.

The request body in [ollama.ts](../lib/ollama.ts) should stay shaped like this:

```json
{
  "model": "qwen3:4b",
  "prompt": "...",
  "system": "...",
  "stream": false,
  "options": {
    "temperature": 0,
    "top_p": 1,
    "num_predict": 600
  }
}
```

Do not add `format` back unless we explicitly test that the chosen local model and Ollama version handle it reliably.

## 3. Target Schema

The target contract is defined in [generated-answer-v1.schema.json](../lib/schemas/generated-answer-v1.schema.json).

The model should return one object with these fields:

- `question`: the original child question
- `benchmark_id`: optional ID like `BQ-01` when the question maps to a curated benchmark
- `topic`: one of the Wonder Journal topic buckets
- `fact_answer`: the shortest trustworthy explanation
- `story_title`: title for the story surface
- `story_text`: the story-led answer
- `narration_text`: model-provided narration text, currently normalized by the server
- `wonder_question`: a follow-up prompt that starts with `I wonder`
- `scene_tags`: reusable visual tags
- `safety_flags`: quality or trust alerts
- `confidence`: model-reported confidence, treated only as a hint
- `source`: server-stamped provenance: `benchmark`, `hybrid`, `model`, or `fallback`

Example:

```json
{
  "question": "Why does the moon follow our car?",
  "benchmark_id": "BQ-01",
  "topic": "space",
  "fact_answer": "The moon looks like it follows your car because it is very far away, so it seems to move much more slowly than nearby trees and buildings.",
  "story_title": "The Moon Comes Along",
  "story_text": "Aanya looked out of the car window and saw the moon glowing like a soft round lamp...",
  "narration_text": "The moon looks like it follows your car because it is very far away, so it seems to move much more slowly than nearby trees and buildings.",
  "wonder_question": "I wonder why nearby trees seem to race past the window?",
  "scene_tags": ["moon", "car", "night", "trees", "distance"],
  "safety_flags": ["none"],
  "confidence": 0.96
}
```

## 4. Product Rules For Each Field

### `fact_answer`

This is the truth anchor.

Rules:

- must be factual
- must directly answer the question
- should usually fit in 1-2 spoken sentences
- should survive even if the story is hidden

### `story_text`

This is the playful explanation.

Rules:

- should support the fact, not replace it
- should make the answer easier to picture
- should stay short enough for ages 3-6
- should never become more magical than truthful
- should not delay the answer with a long setup

### `narration_text`

This is the read-aloud layer.

Current implementation note:

- the model is asked for `narration_text`
- the server currently normalizes narration to the sentence-ended `fact_answer`
- this avoids teaser narration like “let’s go on an adventure and find out”

That product choice keeps read-aloud answer-first and predictable.

### `wonder_question`

This is optional product flavor, not the main job.

Rules:

- must start with `I wonder`
- must stay on-topic
- must never distract from the answer

If this becomes confusing in the UI, hide it rather than letting it compete with the answer.

### `scene_tags`

These power reusable visuals.

Rules:

- must describe visible things
- should avoid abstract tags only
- should help match a starter SVG, curated image, animation, or future generated image

## 5. Generation Pipeline

The current production-shaped flow is:

1. Normalize the question.
2. Check for benchmark match.
3. Inject benchmark guidance if matched.
4. Call Ollama with strict JSON instructions and no `format` field.
5. Parse with `extractJsonObject`.
6. Validate and normalize with `validateGeneratedAnswerV1`.
7. Run safety and quality checks.
8. Match a visual scene.
9. Save successful answers to SQLite unless the request explicitly disables saving.
10. Return a render-ready answer object to the browser.

## 6. Benchmark-Aware Mode

If the question maps to the benchmark set:

- the app injects the benchmark truth note
- the model still writes the story and scene metadata
- the model must not contradict the benchmark fact
- returned source is usually `hybrid`

This is how we make common kid questions safer without turning the whole product into a fixed FAQ.

## 7. Fallback Strategy

The product should not pretend the model succeeded when the answer is weak.

Fallback can trigger when:

- Ollama is unavailable
- Ollama times out
- JSON parsing fails
- required fields are missing
- quality checks fail
- safety routing requires parent review

Fallback answers should be honest and safe. They should not be treated as high-quality journal entries unless we explicitly mark them as needing retry or review.

## 8. What To Test

Contract testing should cover:

- valid JSON from dummy mode
- valid JSON from live Ollama mode
- malformed model output with prose before or after JSON
- missing required fields
- wrong topic values
- teaser narration
- benchmark fact preservation
- timeout behavior
- fallback behavior

The important test is not “did the app produce text?”.

The important test is: did the app produce a factual, child-safe, answer-first object that the UI can render reliably?

## 9. Future Option: Structured Outputs

Ollama supports structured outputs in some model/runtime combinations.

That may become useful later, but it is not the current Wonder Journal contract path.

If we revisit it, we should add it behind an explicit environment flag and compare:

- JSON validity rate
- latency
- factual quality
- compatibility with `qwen3:4b` and any replacement local model
- failure behavior on the personal laptop

Until then, the source of truth is local validation, not Ollama-enforced schema output.

## 10. Recommendation

Keep the structured contract.

Keep the `format` field out for now.

Keep improving the validator, benchmark set, and live Ollama evaluator before adding more product surface.
