---
name: gpt-image-2
description: >-
  Generate and edit product images, illustrations, posters, UI mockups, logos,
  pixel art, photoreal shots, infographics, PPT slides. Use GPT-Image-2 via the
  `nice-image` CLI for generation, editing, blending, and batch product images.
  Trigger when the user asks to generate, create, make, draw, edit, modify,
  change, blend, mix, or fix an image; 生成图片, 做图, 改图, P图, 修图, 海报,
  图标, 插画, 素材, PPT素材, 产品图, 场景图, 融合图片, 批量生图.
---

# GPT-Image-2 via nice-image CLI

You have a `nice-image` CLI tool that wraps the Nice-Token GPT-Image-2 API and the Huoke backend. Use it for ALL image generation, editing, blending, and batch tasks.

## Quick reference

### Simple mode — quick single-image edits (Nice-Token direct)

```bash
nice-image -u "<image_url>" -p "<prompt>"
```

- Requires `NICE_TOKEN_API_KEY` env var (already set in project .claude/settings.json)
- Best for: put product on new background, change scene, add lighting effects

### Subcommands — Huoke backend (requires HUOKE_API_URL + HUOKE_API_KEY)

```bash
nice-image generate-single -p "<prompt>" [--ratio "1:1"] [--resolution "2k"]
nice-image edit-image --image-url "<url>" -p "<edit instructions>" [--ratio "1:1"]
nice-image blend --image-urls "<url1>,<url2>" -p "<blend description>" [--ratio "16:9"]
nice-image generate-images --product-info '<json>' --configs '<json>' [--image-url "<url>"]
```

## When to use which

| Task | Command |
|---|---|
| Product on new background | `nice-image -u "<url>" -p "..."` |
| Pure text-to-image | `nice-image generate-single -p "..."` |
| Edit part of an image | `nice-image edit-image --image-url "<url>" -p "change ONLY X..."` |
| Merge 2+ images into one scene | `nice-image blend --image-urls "...,..." -p "..."` |
| Batch many product variants | `nice-image generate-images --product-info '...' --configs '...'` |

## Prompt rules for GPT-Image-2

1. **State intent first, not subject.** "Create a product hero image for an e-commerce listing..." not "A coffee cup..."
2. **Quote every character of text.** `"Fresh Brew" in bold white Helvetica, bottom-center`
3. **Use spec language, not praise language.** "50mm f/2.8, north window light, 35mm film grain" NOT "cinematic, professional, high quality"
4. **Edits: "change ONLY X / preserve Y exactly."** Never re-describe the whole image.
5. **One style anchor, not five.** Pick ONE: "Studio Ghibli watercolor" or "vector flat illustration" or "35mm product photography"
6. **Drop ALL magic words.** Never use: 4K, 8K, ultra-detailed, masterpiece, trending on artstation, cinematic lighting, premium quality

## Visual self-verification

After generating, use `Read` to check the output image against the prompt:
1. Text rendered correctly?
2. Composition matches intent?
3. Style anchor applied?
4. Nothing from the banned-words list visible in the image?

If anything fails, fix ONE dimension and regenerate.

## Resolution reference

| Use case | Ratio | Resolution |
|---|---|---|
| Product main image (Amazon/e-commerce) | 1:1 | 2k |
| Banner / hero image | 16:9 | 2k |
| Mobile / story / portrait | 9:16 | 2k |
| PPT slide | 16:9 | 2k |
| Detail / zoom | 1:1 | 4k |
