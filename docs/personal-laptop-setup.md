# Wonder Journal Personal Laptop Setup

Use this when moving Wonder Journal to a personal laptop for local Ollama testing.

## 1. Move The Project

Preferred options:

- Use a private Git repo and clone it on the personal laptop.
- Or copy the full `wonder-journal` folder with AirDrop, zip, or external drive.

Do not rely on the existing local SQLite database for product testing. It is fine to start fresh.

## 2. Install App Dependencies

```bash
cd wonder-journal
npm install
```

## 3. Install Ollama

Download from:

```text
https://ollama.com/download
```

Then pull the first test model:

```bash
ollama pull qwen3:4b
```

Optional fallback model:

```bash
ollama pull gemma3:4b
```

## 4. Configure `.env.local`

For dummy mode:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
USE_DUMMY_STORIES=true
NEXT_PUBLIC_USE_DUMMY_STORIES=true
```

For real Ollama mode:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
USE_DUMMY_STORIES=false
NEXT_PUBLIC_USE_DUMMY_STORIES=false
```

## 5. Start The App

```bash
npm run dev -- -H 0.0.0.0
```

Laptop URL:

```text
http://127.0.0.1:3000
```

Phone URL on the same Wi-Fi:

```text
http://<your-laptop-ip>:3000
```

Find the laptop IP on macOS:

```bash
ipconfig getifaddr en0
```

## 6. Verify Ollama Readiness

With the Next.js app running:

```bash
npm run check:ollama
```

Then run a contract-generation check:

```bash
npm run check:ollama:generate
```

## 7. Run The Product Contract Evaluation

Smoke test:

```bash
npm run evaluate:contract -- --smoke
```

Full benchmark:

```bash
npm run evaluate:contract
```

Reports are written to:

```text
reports/contract-evals/
```

## 8. Compare Models

Change `.env.local`:

```env
OLLAMA_MODEL=gemma3:4b
```

Restart the dev server, then rerun:

```bash
npm run check:ollama:generate
npm run evaluate:contract
```

Compare the report files by:

- schema validity
- fallback usage
- topic correctness
- confidence
- latency
- quality of fact answer
- quality of narration text
