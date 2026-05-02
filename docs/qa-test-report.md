# Wonder Journal QA Checkpoint

Date: 2026-05-02

## Product Story Under Test

Wonder Journal should let a parent or child open the app, ask a question, receive a kid-friendly Wonder Card, see a matching visual clue, optionally hear narration, and save the answer into a local journal.

Current test mode uses dummy answers because Ollama is not running on this machine. The Ollama contract path is present, but real-model quality and latency still need to be tested on the personal laptop with `USE_DUMMY_STORIES=false`.

## Test Cases

| Area | Test case | Execution | Result |
| --- | --- | --- | --- |
| Home | `/` renders successfully | Automated smoke | Pass |
| Home | Default home does not leak reviewer/dev copy | Automated smoke | Pass |
| Journal | `/journal` renders successfully | Automated smoke | Pass |
| Input validation | Blank question rejected | Automated smoke | Pass |
| Input validation | Non-string question rejected | Automated smoke | Pass |
| Input validation | HTML-only question rejected after sanitization | Automated smoke | Pass |
| Input validation | Overly long question rejected | Automated smoke | Pass |
| Profile safety | Child name HTML is stripped | Automated smoke | Pass |
| Generation | Moon question returns Wonder Card shape | Automated smoke | Pass |
| Generation | `save=false` does not persist | Automated smoke | Pass |
| Generation | Default generation persists and can be fetched | Automated smoke | Pass |
| Narration copy | Removed `ting` token does not appear in payload | Automated smoke | Pass |
| Images | Moon question receives fetchable starter image | Automated smoke | Pass |
| Images | All 10 topics return fetchable starter images | Automated smoke | Pass |
| Journal API | `/api/stories` returns array | Automated smoke | Pass |
| Detail API | Saved story can be fetched by id | Automated smoke | Pass |
| Detail API | Invalid story id is rejected | Automated smoke | Pass |
| Safety | Sensitive question routes to parent-review fallback and does not save | Automated smoke | Pass |
| Ollama readiness | Health endpoint reports model/readiness explicitly | Automated smoke | Pass with expected 503 locally |
| Contract | Benchmark contract set passes | Automated contract eval | Pass |
| Type safety | TypeScript compile check | Automated | Pass |
| Production build | Next.js production build | Automated | Pass |
| Browser interaction | Onboarding taps, sample-question taps, Moon `Near/Far/Both`, voice selector, story-mode expansion | Manual review needed | Pending |

## Execution Evidence

Latest automated smoke run:

```text
QA smoke result: 29/29 passed.
```

Other checks:

```text
npx tsc --noEmit
Pass

npm run build
Pass

npm run evaluate:contract -- --smoke
Passed 5/5

npm run evaluate:contract
Passed 25/25

npm run check:ollama
Expected local result here: reachable=false, model=qwen3:4b
```

## Gaps Found And Fixed

1. **Reviewer language could leak into the product mental model.**
   Fixed by rewriting the review-shell copy to be customer-facing. The default home path is also now smoke-tested to ensure it does not render phrases like `This is the LLM handoff moment`.

2. **Parent typed CTA still said `Make a story`.**
   Fixed to `Show answer` because the product has shifted to answer-first, with story as optional depth.

3. **Topic classifier matched accidental substrings.**
   `plants` matched `ant`, and `trains` matched `rain`, which could route answers to the wrong image/topic. Fixed keyword matching to use whole words and phrases.

4. **Image coverage was under-tested.**
   Expanded QA to check every topic category returns a fetchable starter image, so the app no longer silently falls back into broken image states.

5. **Dev server cache broke after production build.**
   Confirmed this is a local Next dev cache issue, not a product bug. The server was restarted cleanly after build and the smoke suite was rerun.

## Remaining Risks

1. **Real Ollama quality is not verified on this machine.**
   The health endpoint correctly reports Ollama as unavailable here. Real test must happen on the personal laptop after pulling `qwen3:4b` and setting `USE_DUMMY_STORIES=false`.

2. **Voice recognition and narration need real-device testing.**
   Browser speech APIs vary heavily across iPhone Safari, Chrome, and desktop. The UI supports voice, but product confidence requires a real phone pass.

3. **In-app browser click automation was not available in this session.**
   The local HTTP, API, image, data, type, contract, and build checks ran successfully. The remaining click-level checks should be reviewed manually in the browser at `http://127.0.0.1:3000/`.

4. **Family-readiness is still about behavior, not just tests.**
   The product now has a cleaner answer-first format, but we still need to observe whether a child asks a second question unprompted and whether a parent trusts the answer.

5. **The follow-up `wonder_question` still exists in the contract.**
   It is not the primary visible experience anymore. We can keep it internally for future use, but it should not distract from the core job: answer the curiosity.

## Verdict

The prototype is directionally correct again. The strongest product shape is:

1. Child asks a question.
2. App gives a short answer first.
3. App shows a visual clue or tiny animation.
4. App offers narration.
5. Story mode is optional, not the main answer.
6. The answer saves into the journal.

The next unlock is not more UI. It is real-model testing on the personal laptop: latency, factuality, narration feel, and whether the answer format survives real Ollama output.
