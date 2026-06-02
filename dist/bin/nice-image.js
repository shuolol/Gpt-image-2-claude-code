#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { generateProductImage } from "../services/imageService.js";
import { generateImages, generateSingleImage, editImage, blendImages, } from "../services/huokeService.js";
const USAGE = `
nice-image — AI product image generation CLI

Usage:
  nice-image -u <imageUrl> -p <prompt>       # Direct Nice-Token (simple mode)
  nice-image <subcommand> [options]           # Huoke backend endpoints

Subcommands:
  generate-single       Generate a single image from a text prompt
  edit-image            Edit an existing image
  blend                 Blend multiple images together
  generate-images       Batch generate product images (SSE stream)

Simple mode options:
  -u, --url             Original product image URL (required)
  -p, --prompt          Generation prompt (required)

Common options:
  -h, --help            Show this help

Run "nice-image <subcommand> --help" for subcommand-specific options.

Environment:
  NICE_TOKEN_API_KEY    API key for direct Nice-Token calls (simple mode)
  HUOKE_API_URL         Base URL of Huoke API server (subcommands)
  HUOKE_API_KEY         API key / JWT for Huoke Authorization: Bearer

Examples:
  nice-image -u "https://example.com/product.jpg" -p "Marble table background"

  nice-image generate-single -p "A coffee mug on a wooden table" --ratio "1:1"

  nice-image edit-image --image-url "https://example.com/product.jpg" \\
    -p "Replace background with beach scene"

  nice-image blend \\
    --image-urls "https://a.com/1.jpg,https://a.com/2.jpg" \\
    -p "Lifestyle scene with both products"

  nice-image generate-images \\
    --product-info '{"name":"Mug"}' \\
    --configs '{"main":1,"scene":2}'
`;
const SUB_USAGE = {
    "generate-single": `
nice-image generate-single — Generate one image from a prompt (Huoke backend)

  -p, --prompt <text>     Image description (required)
  --ratio <ratio>         Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
  --resolution <res>      Resolution: 1k, 2k, 4k
`,
    "edit-image": `
nice-image edit-image — Edit an existing image (Huoke backend)

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
nice-image blend — Blend multiple images into one (Huoke backend)

  -p, --prompt <text>     Blend instructions (required)
  --image-urls <urls>     Comma-separated image URLs
  --image-base64s <b64s>  Comma-separated base64 image strings
  --model <model>         AI model (default: gpt-image-2)
  --resolution <res>      Resolution: 1k, 2k, 4k
  --ratio <ratio>         Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
`,
    "generate-images": `
nice-image generate-images — Batch generate product images (Huoke backend, SSE)

  --product-info <json>   Product metadata as JSON or @filepath (required)
  --configs <json>        Image type counts, e.g. '{"main":1,"scene":2}' (required)
  --image-url <url>       Source product image URL
  --image-base64 <b64>    Source product image as base64
  --resolution <res>      Target resolution: 1k, 2k, 4k
  --ratio <ratio>         Target aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
  --model <model>         AI model name
  --language <lang>       Output language
`,
};
// ─── Helpers ───────────────────────────────────────────────────────
function exitWithError(message) {
    process.stderr.write(`\n❌ ${message}\n\n`);
    process.exit(1);
}
function str(v) {
    return typeof v === "string" ? v : undefined;
}
function resolveJsonArg(raw, label) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("@")) {
        try {
            return JSON.parse(readFileSync(trimmed.slice(1), "utf-8"));
        }
        catch (err) {
            exitWithError(`Failed to read ${label} from file: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    try {
        return JSON.parse(trimmed);
    }
    catch {
        exitWithError(`${label} is not valid JSON. Use inline JSON or @filepath.`);
    }
}
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        exitWithError(`Environment variable ${name} is not set.\nSet it via: export ${name}="your-value"`);
    }
    return value;
}
// ─── Simple mode: direct Nice-Token API ─────────────────────────────
async function cmdSimple(rawArgs) {
    let args;
    try {
        args = parseArgs({
            args: rawArgs,
            options: {
                url: { type: "string", short: "u" },
                prompt: { type: "string", short: "p" },
                help: { type: "boolean", short: "h" },
            },
            allowPositionals: false,
            strict: false,
        });
    }
    catch (err) {
        exitWithError(`Invalid argument: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (args.values.help) {
        process.stdout.write(USAGE);
        process.exit(0);
    }
    const imageUrl = args.values.url?.trim();
    const prompt = args.values.prompt?.trim();
    if (!imageUrl)
        exitWithError("Missing required option: --url (or -u)");
    if (!prompt)
        exitWithError("Missing required option: --prompt (or -p)");
    const apiKey = getRequiredEnv("NICE_TOKEN_API_KEY");
    process.stderr.write("⏳ Generating image via Nice-Token...\n");
    process.stderr.write(`   URL:    ${imageUrl}\n`);
    process.stderr.write(`   Prompt: ${prompt}\n\n`);
    try {
        const resultUrl = await generateProductImage(imageUrl, prompt, apiKey);
        process.stderr.write("✅ Done!\n\n");
        process.stdout.write(resultUrl + "\n");
    }
    catch (err) {
        exitWithError(err instanceof Error ? err.message : `Unknown error: ${String(err)}`);
    }
}
// ─── Subcommand: generate-single (Huoke) ────────────────────────────
async function cmdGenerateSingle(baseUrl, apiKey, rawArgs) {
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
    if (!prompt)
        exitWithError("Missing required option: --prompt (or -p)");
    const req = {
        prompt,
        ratio: str(args.values.ratio),
        resolution: str(args.values.resolution),
    };
    process.stderr.write("⏳ Generating single image via Huoke...\n");
    try {
        const urls = await generateSingleImage(baseUrl, apiKey, req);
        if (urls.length === 0)
            exitWithError("API returned no image URLs");
        process.stderr.write("✅ Done!\n\n");
        for (const u of urls)
            process.stdout.write(u + "\n");
    }
    catch (err) {
        exitWithError(err instanceof Error ? err.message : `Unknown error: ${String(err)}`);
    }
}
// ─── Subcommand: edit-image (Huoke) ─────────────────────────────────
async function cmdEditImage(baseUrl, apiKey, rawArgs) {
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
        process.stdout.write(SUB_USAGE["edit-image"]);
        process.exit(0);
    }
    const prompt = str(args.values.prompt)?.trim();
    if (!prompt)
        exitWithError("Missing required option: --prompt (or -p)");
    const imageUrl = str(args.values["image-url"]);
    const imageBase64 = str(args.values["image-base64"]);
    if (!imageUrl && !imageBase64) {
        exitWithError("Either --image-url or --image-base64 is required");
    }
    const req = {
        prompt,
        image_url: imageUrl,
        image_base64: imageBase64,
        mask_url: str(args.values["mask-url"]),
        mask_base64: str(args.values["mask-base64"]),
        model: str(args.values.model),
        resolution: str(args.values.resolution),
        ratio: str(args.values.ratio),
    };
    process.stderr.write("⏳ Editing image via Huoke...\n");
    try {
        const urls = await editImage(baseUrl, apiKey, req);
        if (urls.length === 0)
            exitWithError("API returned no image URLs");
        process.stderr.write("✅ Done!\n\n");
        for (const u of urls)
            process.stdout.write(u + "\n");
    }
    catch (err) {
        exitWithError(err instanceof Error ? err.message : `Unknown error: ${String(err)}`);
    }
}
// ─── Subcommand: blend (Huoke) ──────────────────────────────────────
async function cmdBlend(baseUrl, apiKey, rawArgs) {
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
    if (!prompt)
        exitWithError("Missing required option: --prompt (or -p)");
    const urlsRaw = str(args.values["image-urls"]);
    const b64sRaw = str(args.values["image-base64s"]);
    const images_url = urlsRaw
        ? urlsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
    const images_base64 = b64sRaw
        ? b64sRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
    if (!images_url?.length && !images_base64?.length) {
        exitWithError("Either --image-urls or --image-base64s is required");
    }
    const req = {
        prompt,
        images_url,
        images_base64,
        model: str(args.values.model),
        resolution: str(args.values.resolution),
        ratio: str(args.values.ratio),
    };
    process.stderr.write("⏳ Blending images via Huoke...\n");
    try {
        const urls = await blendImages(baseUrl, apiKey, req);
        if (urls.length === 0)
            exitWithError("API returned no image URLs");
        process.stderr.write("✅ Done!\n\n");
        for (const u of urls)
            process.stdout.write(u + "\n");
    }
    catch (err) {
        exitWithError(err instanceof Error ? err.message : `Unknown error: ${String(err)}`);
    }
}
// ─── Subcommand: generate-images (Huoke SSE) ─────────────────────────
async function cmdGenerateImages(baseUrl, apiKey, rawArgs) {
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
    if (!productInfoRaw)
        exitWithError("Missing --product-info");
    if (!configsRaw)
        exitWithError("Missing --configs");
    const productInfo = resolveJsonArg(productInfoRaw, "--product-info");
    const configs = resolveJsonArg(configsRaw, "--configs");
    const req = {
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
            }
            else if (event.type === "error") {
                errorCount++;
                process.stderr.write(`  ⚠️  ${event.message}\n`);
            }
            else if (event.type === "done") {
                process.stderr.write(`\n✅ Done: ${imageCount} generated, ${errorCount} errors\n`);
            }
        }
    }
    catch (err) {
        exitWithError(err instanceof Error ? err.message : `Unknown error: ${String(err)}`);
    }
}
// ─── Subcommand routing ─────────────────────────────────────────────
const SUBCOMMANDS = [
    "generate-single",
    "edit-image",
    "blend",
    "generate-images",
];
function isSubcommand(arg) {
    return SUBCOMMANDS.includes(arg);
}
// ─── Entrypoint ─────────────────────────────────────────────────────
async function main() {
    const rawArgs = process.argv.slice(2);
    // --help / no args
    if (rawArgs.length === 0) {
        process.stdout.write(USAGE);
        process.exit(0);
    }
    if (rawArgs.length === 1 && (rawArgs[0] === "-h" || rawArgs[0] === "--help")) {
        process.stdout.write(USAGE);
        process.exit(0);
    }
    const firstArg = rawArgs[0];
    const rest = rawArgs.slice(1);
    if (isSubcommand(firstArg)) {
        // Subcommand mode: Huoke backend
        if (rest.includes("-h") || rest.includes("--help")) {
            process.stdout.write(SUB_USAGE[firstArg]);
            process.exit(0);
        }
        const baseUrl = getRequiredEnv("HUOKE_API_URL");
        const apiKey = getRequiredEnv("HUOKE_API_KEY");
        switch (firstArg) {
            case "generate-single":
                await cmdGenerateSingle(baseUrl, apiKey, rest);
                break;
            case "edit-image":
                await cmdEditImage(baseUrl, apiKey, rest);
                break;
            case "blend":
                await cmdBlend(baseUrl, apiKey, rest);
                break;
            case "generate-images":
                await cmdGenerateImages(baseUrl, apiKey, rest);
                break;
        }
    }
    else {
        // Simple mode: direct Nice-Token API
        await cmdSimple(rawArgs);
    }
}
main();
//# sourceMappingURL=nice-image.js.map