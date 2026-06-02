#!/usr/bin/env node

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import {
  generateImages,
  generateSingleImage,
  editImage,
  blendImages,
} from "../services/huokeService.js";
import type {
  GenerateImagesRequest,
  GenerateSingleImageRequest,
  EditImageRequest,
  BlendImagesRequest,
} from "../services/huokeService.js";

const USAGE = `
huoke-image — AI product image tools via Huoke API

Usage:
  huoke-image <subcommand> [options]

Subcommands:
  generate-images       Batch generate product images (SSE stream)
  generate-single       Generate a single image from a prompt
  edit                  Edit an existing image
  blend                 Blend multiple images together

Common options:
  --base-url <url>      Huoke API base URL (or env HUOKE_API_URL)
  --api-key <key>       API key / JWT token (or env HUOKE_API_KEY)
  -h, --help            Show this help

Run "huoke-image <subcommand> --help" for subcommand-specific options.

Environment:
  HUOKE_API_URL       Base URL of the Huoke API server (required)
  HUOKE_API_KEY       API key or JWT for Authorization: Bearer (required)

Examples:
  huoke-image generate-single -p "A coffee mug on a wooden table" --ratio "1:1"

  huoke-image edit --image-url "https://cdn.example.com/product.jpg" \\
    -p "Replace background with beach scene"

  huoke-image blend \\
    --image-urls "https://a.com/1.jpg,https://a.com/2.jpg" \\
    -p "Blend these products into a lifestyle scene"

  huoke-image generate-images \\
    --product-info '{"name":"Mug","category":"Kitchen"}' \\
    --configs '{"main":1,"scene":2}' \\
    --ratio "1:1"
`;

const SUB_USAGE: Record<string, string> = {
  "generate-images": `
huoke-image generate-images — Batch generate product images

  --product-info <json>   Product metadata as JSON string or @filepath (required)
  --configs <json>        Image type counts, e.g. '{"main":1,"scene":2}' (required)
  --image-url <url>       Source product image URL
  --image-base64 <b64>    Source product image as base64
  --resolution <res>      Target resolution: 1k, 2k, 4k
  --ratio <ratio>         Target aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
  --model <model>         AI model name
  --language <lang>       Output language
`,

  "generate-single": `
huoke-image generate-single — Generate one image from a prompt

  -p, --prompt <text>     Description of the image to generate (required)
  --ratio <ratio>         Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
  --resolution <res>      Resolution: 1k, 2k, 4k
`,

  edit: `
huoke-image edit — Edit an existing image with AI

  -p, --prompt <text>     Edit instructions (required)
  --image-url <url>       Source image URL
  --image-base64 <b64>    Source image as base64
  --mask-url <url>        Mask image URL (optional)
  --mask-base64 <b64>     Mask image as base64 (optional)
  --model <model>         AI model (default: gpt-image-2)
  --resolution <res>      Resolution: 1k, 2k, 4k
  --ratio <ratio>         Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
`,

  blend: `
huoke-image blend — Blend multiple images into one

  -p, --prompt <text>     Blend instructions (required)
  --image-urls <urls>     Comma-separated image URLs
  --image-base64s <b64s>  Comma-separated base64 image strings
  --model <model>         AI model (default: gpt-image-2)
  --resolution <res>      Resolution: 1k, 2k, 4k
  --ratio <ratio>         Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
`,
};

function exitWithError(message: string): never {
  process.stderr.write(`\n❌ ${message}\n\n`);
  process.exit(1);
}

function resolveJsonArg(raw: string, label: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith("@")) {
    try {
      const filePath = trimmed.slice(1);
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      exitWithError(
        `Failed to read ${label} from file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    exitWithError(`${label} is not valid JSON. Use inline JSON or @filepath.`);
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    exitWithError(
      `Environment variable ${name} is not set.\nSet it via: export ${name}="your-value"`,
    );
  }
  return value;
}

// parseArgs returns string | boolean for typed options; coerce strings.
function str(v: string | boolean | (string | boolean)[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

// ─── Subcommand handlers ───────────────────────────────────────────

async function cmdGenerateImages(
  baseUrl: string,
  apiKey: string,
  rawArgs: string[],
): Promise<void> {
  const args = parseArgs({
    args: rawArgs,
    options: {
      "product-info": { type: "string" },
      configs: { type: "string" },
      "image-url": { type: "string" },
      "image-base64": { type: "string" },
      resolution: { type: "string" },
      ratio: { type: "string" },
      model: { type: "string" },
      language: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
    strict: false,
  });

  if (args.values.help) {
    process.stdout.write(SUB_USAGE["generate-images"]);
    process.exit(0);
  }

  const productInfoRaw = str(args.values["product-info"]);
  const configsRaw = str(args.values.configs);

  if (!productInfoRaw) {
    exitWithError("Missing --product-info");
  }
  if (!configsRaw) {
    exitWithError("Missing --configs");
  }

  const productInfo = resolveJsonArg(productInfoRaw, "--product-info");
  const configs = resolveJsonArg(configsRaw, "--configs") as Record<
    string,
    number
  >;

  const req: GenerateImagesRequest = {
    product_info: productInfo,
    configs,
    language: str(args.values.language),
    model: str(args.values.model),
    image_url: str(args.values["image-url"]),
    image_base64: str(args.values["image-base64"]),
    resolution: str(args.values.resolution),
    ratio: str(args.values.ratio),
  };

  process.stderr.write("⏳ Generating images via SSE stream...\n");

  try {
    let imageCount = 0;
    let errorCount = 0;

    for await (const event of generateImages(baseUrl, apiKey, req)) {
      if (event.type === "image") {
        imageCount++;
        process.stdout.write(`${event.url}\n`);
        process.stderr.write(`  [${imageCount}] ${event.url}\n`);
      } else if (event.type === "error") {
        errorCount++;
        process.stderr.write(`  ⚠️  ${event.message}\n`);
      } else if (event.type === "done") {
        process.stderr.write(
          `\n✅ Done: ${imageCount} generated, ${errorCount} errors\n`,
        );
      }
    }
  } catch (err) {
    exitWithError(
      err instanceof Error ? err.message : `Unknown error: ${String(err)}`,
    );
  }
}

async function cmdGenerateSingle(
  baseUrl: string,
  apiKey: string,
  rawArgs: string[],
): Promise<void> {
  const args = parseArgs({
    args: rawArgs,
    options: {
      prompt: { type: "string", short: "p" },
      ratio: { type: "string" },
      resolution: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
    strict: false,
  });

  if (args.values.help) {
    process.stdout.write(SUB_USAGE["generate-single"]);
    process.exit(0);
  }

  const prompt = str(args.values.prompt)?.trim();
  if (!prompt) {
    exitWithError("Missing required option: --prompt (or -p)");
  }

  const req: GenerateSingleImageRequest = {
    prompt,
    ratio: str(args.values.ratio),
    resolution: str(args.values.resolution),
  };

  process.stderr.write("⏳ Generating single image...\n");

  try {
    const urls = await generateSingleImage(baseUrl, apiKey, req);
    if (urls.length === 0) {
      exitWithError("API returned no image URLs");
    }
    process.stderr.write("✅ Done!\n\n");
    for (const u of urls) {
      process.stdout.write(u + "\n");
    }
  } catch (err) {
    exitWithError(
      err instanceof Error ? err.message : `Unknown error: ${String(err)}`,
    );
  }
}

async function cmdEdit(
  baseUrl: string,
  apiKey: string,
  rawArgs: string[],
): Promise<void> {
  const args = parseArgs({
    args: rawArgs,
    options: {
      prompt: { type: "string", short: "p" },
      "image-url": { type: "string" },
      "image-base64": { type: "string" },
      "mask-url": { type: "string" },
      "mask-base64": { type: "string" },
      model: { type: "string" },
      resolution: { type: "string" },
      ratio: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
    strict: false,
  });

  if (args.values.help) {
    process.stdout.write(SUB_USAGE.edit);
    process.exit(0);
  }

  const prompt = str(args.values.prompt)?.trim();
  if (!prompt) {
    exitWithError("Missing required option: --prompt (or -p)");
  }

  const imageUrl = str(args.values["image-url"]);
  const imageBase64 = str(args.values["image-base64"]);
  if (!imageUrl && !imageBase64) {
    exitWithError("Either --image-url or --image-base64 is required");
  }

  const req: EditImageRequest = {
    prompt,
    image_url: imageUrl,
    image_base64: imageBase64,
    mask_url: str(args.values["mask-url"]),
    mask_base64: str(args.values["mask-base64"]),
    model: str(args.values.model),
    resolution: str(args.values.resolution),
    ratio: str(args.values.ratio),
  };

  process.stderr.write("⏳ Editing image...\n");

  try {
    const urls = await editImage(baseUrl, apiKey, req);
    if (urls.length === 0) {
      exitWithError("API returned no image URLs");
    }
    process.stderr.write("✅ Done!\n\n");
    for (const u of urls) {
      process.stdout.write(u + "\n");
    }
  } catch (err) {
    exitWithError(
      err instanceof Error ? err.message : `Unknown error: ${String(err)}`,
    );
  }
}

async function cmdBlend(
  baseUrl: string,
  apiKey: string,
  rawArgs: string[],
): Promise<void> {
  const args = parseArgs({
    args: rawArgs,
    options: {
      prompt: { type: "string", short: "p" },
      "image-urls": { type: "string" },
      "image-base64s": { type: "string" },
      model: { type: "string" },
      resolution: { type: "string" },
      ratio: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
    strict: false,
  });

  if (args.values.help) {
    process.stdout.write(SUB_USAGE.blend);
    process.exit(0);
  }

  const prompt = str(args.values.prompt)?.trim();
  if (!prompt) {
    exitWithError("Missing required option: --prompt (or -p)");
  }

  const urlsRaw = str(args.values["image-urls"]);
  const b64sRaw = str(args.values["image-base64s"]);

  const images_url = urlsRaw
    ? urlsRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined;
  const images_base64 = b64sRaw
    ? b64sRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  if (!images_url?.length && !images_base64?.length) {
    exitWithError("Either --image-urls or --image-base64s is required");
  }

  const req: BlendImagesRequest = {
    prompt,
    images_url,
    images_base64,
    model: str(args.values.model),
    resolution: str(args.values.resolution),
    ratio: str(args.values.ratio),
  };

  process.stderr.write("⏳ Blending images...\n");

  try {
    const urls = await blendImages(baseUrl, apiKey, req);
    if (urls.length === 0) {
      exitWithError("API returned no image URLs");
    }
    process.stderr.write("✅ Done!\n\n");
    for (const u of urls) {
      process.stdout.write(u + "\n");
    }
  } catch (err) {
    exitWithError(
      err instanceof Error ? err.message : `Unknown error: ${String(err)}`,
    );
  }
}

// ─── Main entrypoint ───────────────────────────────────────────────

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  // Show main usage when no args or --help is the only arg (no subcommand)
  if (rawArgs.length === 0 || (rawArgs.length === 1 && (rawArgs[0] === "-h" || rawArgs[0] === "--help"))) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  const subcommand = rawArgs[0];
  const rest = rawArgs.slice(1);

  const VALID_COMMANDS = ["generate-images", "generate-single", "edit", "blend"];
  if (!VALID_COMMANDS.includes(subcommand)) {
    exitWithError(
      `Unknown subcommand: "${subcommand}"\nValid: ${VALID_COMMANDS.join(", ")}`,
    );
  }

  // Handle subcommand-level --help
  if (rest.includes("-h") || rest.includes("--help")) {
    process.stdout.write(SUB_USAGE[subcommand]);
    process.exit(0);
  }

  const baseUrl = getRequiredEnv("HUOKE_API_URL");
  const apiKey = getRequiredEnv("HUOKE_API_KEY");

  switch (subcommand) {
    case "generate-images":
      await cmdGenerateImages(baseUrl, apiKey, rest);
      break;
    case "generate-single":
      await cmdGenerateSingle(baseUrl, apiKey, rest);
      break;
    case "edit":
      await cmdEdit(baseUrl, apiKey, rest);
      break;
    case "blend":
      await cmdBlend(baseUrl, apiKey, rest);
      break;
  }
}

main();
