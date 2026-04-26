# Wonder Journal Ollama V1 Contract

This document describes how Wonder Journal should evolve from the current simple story JSON to a product-ready structured answer contract.

Related schema:

- [generated-answer-v1.schema.json](</Users/dswain/Documents/New project/wonder-journal/lib/schemas/generated-answer-v1.schema.json>)

## 1. Why We Need A Stricter Contract

The current generation shape is close to:

```json
{
  "title": "short fun title",
  "story": "story text",
  "wonder_question": "I wonder ...",
  "topic": "space"
}
```

That is good enough for a prototype, but not good enough for a product.

It has three major weaknesses:

- no short factual answer
- no dedicated narration field
- no scene metadata for reusable visual matching

In a real product, the LLM should not decide the entire experience in one blob of prose.
It should return structured parts that the app can validate and render.

## 2. V1 Contract Goal

The model should produce one answer object with:

- a truth anchor
- a child-friendly story wrapper
- a shorter narration layer
- a follow-up curiosity prompt
- reusable scene tags
- a confidence signal

## 3. Target Schema

The target contract is defined in:

- [generated-answer-v1.schema.json](</Users/dswain/Documents/New project/wonder-journal/lib/schemas/generated-answer-v1.schema.json>)

### Fields

- `question`
  - the original child question
- `benchmark_id`
  - optional ID like `BQ-01` when the question maps to a known benchmark
- `topic`
  - one of the Wonder Journal topic buckets
- `fact_answer`
  - the shortest trustworthy explanation
- `story_title`
  - title for the story surface
- `story_text`
  - the story-led answer
- `narration_text`
  - a shorter read-aloud version
- `wonder_question`
  - a follow-up that starts with `I wonder`
- `scene_tags`
  - reusable visual tags
- `safety_flags`
  - quality or trust alerts
- `confidence`
  - model confidence between 0 and 1
- `source`
  - server-stamped provenance: `benchmark`, `hybrid`, `model`, or `fallback`

## 4. Product Rules For Each Field

### `fact_answer`

This is the most important field.

Rules:

- must be factual
- must be shorter than the story
- should usually fit in 1-2 spoken sentences
- should survive if the story is hidden

### `story_text`

Rules:

- should support the fact, not replace it
- should stay short enough for ages 3-6
- should use sensory language carefully
- should never become more magical than truthful

### `narration_text`

Rules:

- should be easier to listen to than `story_text`
- should be shorter and more direct
- should sound natural when read aloud

### `wonder_question`

Rules:

- must keep the topic open
- must not change topics abruptly
- must feel answerable later

### `scene_tags`

Rules:

- must describe visible things, not abstract themes only
- should support image lookup
- should match the first reusable scene before a custom image

## 5. Recommended Generation Pipeline

Use this flow for production:

1. Normalize the question
2. Check for benchmark match
3. Retrieve benchmark guidance if matched
4. Call Ollama with schema-constrained output
5. Validate JSON against schema
6. Run safety and quality checks
7. Match image scene
8. Render answer
9. Save to journal

## 6. Benchmark-Aware Mode

If the question is in the benchmark set:

- the app should inject the benchmark truth note
- the model should still write the story and narration
- the model should not invent a new fact answer
- the returned answer source should be `hybrid` for model-written benchmark answers, or `benchmark` for deterministic dummy/curated answers

In other words:

- benchmark questions should be content-guided
- long-tail questions can remain more model-led

## 7. Fallback Strategy

The product should not pretend confidence when the answer is weak.

### Low-confidence cases

If:

- schema validation fails
- confidence is below threshold
- scene tags are too vague
- safety flags contain `needs-parent-review`

Then:

- retry once with a stricter prompt
- if still weak, return a graceful parent-safe fallback
- do not trust model-reported `confidence` as the quality gate; use server-side checks and provenance

### Fallback UX

Instead of hallucinating, say something like:

`I want to answer that carefully. Let me try again with a simpler story.`

If the second try is still weak:

- do not store the answer as a successful journal entry
- surface the retry path

## 8. Example Output

```json
{
  "question": "Why does the moon follow our car?",
  "benchmark_id": "BQ-01",
  "topic": "space",
  "fact_answer": "The moon is so far away that it seems to stay with us while nearby things move quickly past.",
  "story_title": "The Moon Outside the Window",
  "story_text": "One night, Anvita looked out of the car window and noticed that the moon seemed to come along for the ride...",
  "narration_text": "The moon is not really following our car. It only looks that way because the moon is very far away, while nearby trees and signs move past quickly.",
  "wonder_question": "I wonder why the moon looks bigger near the horizon?",
  "scene_tags": ["moon", "car", "night", "trees", "distance"],
  "safety_flags": ["none"],
  "confidence": 0.96
}
```

## 9. How To Prompt Ollama

Ollama supports structured outputs with a schema-based format contract.

Use that instead of asking the model to "please return JSON" and hoping it behaves.

Recommended prompt strategy:

- system prompt:
  - child-safe answerer
  - factual first
  - story second
  - no extra text outside schema
- user prompt:
  - original question
  - child profile
  - benchmark truth note when available

Reference:

- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)

## 10. Integration Steps In This Repo

### Step 1

Create a new generation adapter that targets the schema instead of the current `GeneratedStory` type.

### Step 2

Split the current answer UI into:

- fact answer region
- narration region
- story region
- scene region

### Step 3

Update the DB model if needed to store:

- fact answer
- narration text
- scene tags
- confidence

### Step 4

Add a benchmark override layer before generation.

### Step 5

Add validation before saving any answer.

## 11. Recommendation

Do not wire Ollama directly into the current prototype shape for too long.

Move to the structured contract early.

That one decision will make:

- evaluation easier
- visual matching easier
- narration better
- factual quality easier to protect
