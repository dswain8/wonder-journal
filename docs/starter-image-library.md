# Starter Image Library

Wonder Journal uses a local starter image pack while the app is still local-first and latency-sensitive.

## Why

- Local LLM generation is already slow enough for a kid-facing moment.
- Runtime image generation would add another expensive wait.
- A curated image library gives every answer a warm visual immediately.

## Current Pack

The checked-in starter pack lives in:

```text
public/images/starter/
```

It includes SVG scenes for:

- moon/car and stars
- peacock/rain and butterfly/garden
- rainbow/rain and rain/puddles
- seed/sprout
- heartbeat/body
- kitchen/food
- ocean/wave/fish
- rocket/transport
- prism/colors
- lamp/book/wonder

The matcher is configured in `lib/imageLibrary.ts`. Each image has:

- `path`
- `category`
- `tags`

The API chooses an image through `lib/matchImage.ts`, using the generated topic and the child's question.

## How To Expand

1. Add an image file under `public/images/starter/` or the relevant category folder.
2. Add a matching entry to `IMAGE_LIBRARY` in `lib/imageLibrary.ts`.
3. Include simple tags that a child might say, like `moon`, `car`, `rain`, `peacock`, `heart`, or `rainbow`.

For V1, prefer lightweight `.svg` or compressed `.webp` files. Avoid runtime image generation until the answer latency is comfortably fast.
