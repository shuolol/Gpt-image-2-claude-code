/**
 * Call the Nice-Token product/edit-image API to generate an AI-edited product image.
 * Mirrors the fetch logic from the Shopify app._index.tsx action handler.
 */
export declare function generateProductImage(imageUrl: string, prompt: string, apiKey: string): Promise<string>;
