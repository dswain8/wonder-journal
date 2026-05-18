# Real Ollama Evaluation

Use this to evaluate Wonder Journal with the real local Ollama model, not dummy mode.

## 1. Start Ollama

```bash
ollama serve
ollama pull qwen3:4b
```

## 2. Start Wonder Journal

In a second terminal:

```bash
git pull origin main
npm install

OLLAMA_MODEL=qwen3:4b \
USE_DUMMY_STORIES=false \
NEXT_PUBLIC_USE_DUMMY_STORIES=false \
npm run dev -- -H 0.0.0.0
```

## 3. Run the evaluator

In a third terminal:

```bash
OLLAMA_MODEL=qwen3:4b npm run evaluate:ollama:real
```

For a faster first check:

```bash
OLLAMA_MODEL=qwen3:4b npm run evaluate:ollama:smoke
```

## 4. What it writes

Each run writes a local folder under:

```text
eval-runs/<timestamp>-qwen3-4b/
```

Files:

- `results.jsonl` — full raw answer and story payloads, one JSON object per question.
- `summary.csv` — spreadsheet-friendly summary.
- `summary.md` — readable scorecard to paste into ChatGPT/Codex.
- `failures.md` — only failed or suspicious rows, with evidence.

## 5. What to send back

Send:

```text
eval-runs/<latest-run>/summary.md
eval-runs/<latest-run>/failures.md
```

If a result looks visibly wrong in the UI, also send a screenshot.

## Notes

- The evaluator calls `/api/answer` first and `/api/story` second, so it measures the progressive flow.
- By default it expects live Ollama mode. If dummy mode is running, it fails.
- `eval-runs/` is ignored by Git because these are local measurement artifacts.
