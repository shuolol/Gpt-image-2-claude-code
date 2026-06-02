---
name: gpt-image-2
description: AI product image generation and editing via GPT-Image-2. Use when asked to generate, edit, blend, or batch-create product images.
---

# GPT-Image-2 Image Generation

One CLI tool covering 5 endpoints:

## Simple mode — Direct Nice-Token API

Quick single-image editing from image URL + prompt:

```bash
nice-image -u "<image_url>" -p "<prompt>"
```

Requires `NICE_TOKEN_API_KEY` env var. Best for quick one-off edits.

## Huoke backend subcommands

Requires `HUOKE_API_URL` and `HUOKE_API_KEY` env vars.

### generate-single — text-to-image
```bash
nice-image generate-single -p "<prompt>" [--ratio "1:1"] [--resolution "2k"]
```

### edit-image — edit existing image
```bash
nice-image edit-image --image-url "<url>" -p "<edit instructions>" [--ratio "1:1"]
```

### blend — merge multiple images
```bash
nice-image blend --image-urls "<url1>,<url2>" -p "<blend description>" [--ratio "16:9"]
```

### generate-images — batch (SSE stream)
```bash
nice-image generate-images --product-info '<json>' --configs '<json>' [--image-url "<url>"]
```

## Rules

1. URLs are printed to **stdout** (one per line), progress to **stderr**.
2. For quick single-image edits, use simple mode: `nice-image -u "<url>" -p "<prompt>"`.
3. Default to `--ratio "1:1"` unless user specifies otherwise.
4. Always show the generated image URL to the user after success.
5. If the command fails, read stderr and explain the error.
