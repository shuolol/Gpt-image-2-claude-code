#!/usr/bin/env node
import { parseArgs } from "node:util";
import { generateProductImage } from "../services/imageService.js";
const USAGE = `
magic-image — AI product image generator via Nice-Token API

Usage:
  magic-image --url <imageUrl> --prompt <text>

Options:
  -u, --url      Original product image URL (required)
  -p, --prompt   Generation prompt describing the desired output (required)
  -h, --help     Show this help

Environment:
  NICE_TOKEN_API_KEY   API key for img.nice-token.com (required)

Examples:
  magic-image -u "https://example.com/product.jpg" -p "Put the product on a marble table with soft sunlight"

  # Using in Claude Code / OpenCode / other Agent:
  magic-image -u "https://example.com/product.jpg" -p "Replace background with a beach scene"
`;
function exitWithError(message) {
    process.stderr.write(`\n❌ ${message}\n\n`);
    process.exit(1);
}
async function main() {
    let args;
    try {
        args = parseArgs({
            options: {
                url: { type: "string", short: "u" },
                prompt: { type: "string", short: "p" },
                help: { type: "boolean", short: "h" },
            },
            allowPositionals: false,
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
    if (!imageUrl) {
        exitWithError('Missing required option: --url (or -u)\n' + USAGE);
    }
    if (!prompt) {
        exitWithError('Missing required option: --prompt (or -p)\n' + USAGE);
    }
    const apiKey = process.env.NICE_TOKEN_API_KEY?.trim();
    if (!apiKey) {
        exitWithError('Environment variable NICE_TOKEN_API_KEY is not set.\n' +
            'Set it via: export NICE_TOKEN_API_KEY="your-key-here"\n' +
            'Or create a .env file in your project with: NICE_TOKEN_API_KEY=your-key-here');
    }
    process.stderr.write("⏳ Generating image...\n");
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
main();
//# sourceMappingURL=run.js.map