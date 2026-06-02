const API_BASE = "https://img.nice-token.com";
/**
 * Call the Nice-Token product/edit-image API to generate an AI-edited product image.
 * Mirrors the fetch logic from the Shopify app._index.tsx action handler.
 */
export async function generateProductImage(imageUrl, prompt, apiKey) {
    const url = `${API_BASE}/api/v1/product/edit-image`;
    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({ image_url: imageUrl, prompt: prompt.trim() }),
        });
    }
    catch (err) {
        throw new Error(`Network error calling AI API: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API error (${response.status}): ${errText}`);
    }
    let data;
    try {
        data = (await response.json());
    }
    catch {
        throw new Error("AI API returned invalid JSON response");
    }
    if (data.code !== 200 || !data.data?.length) {
        throw new Error(data.msg
            ? `AI API error: ${data.msg}`
            : "AI API returned no image URL");
    }
    return data.data[0];
}
//# sourceMappingURL=imageService.js.map