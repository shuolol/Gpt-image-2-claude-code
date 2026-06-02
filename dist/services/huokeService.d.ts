export interface GenerateImagesRequest {
    product_info: unknown;
    configs: Record<string, number>;
    language?: string;
    model?: string;
    image_base64?: string;
    image_url?: string;
    resolution?: string;
    ratio?: string;
    session_id?: string;
    message_id?: string;
    session_title?: string;
}
export interface GenerateSingleImageRequest {
    prompt: string;
    ratio?: string;
    resolution?: string;
}
export interface EditImageRequest {
    prompt: string;
    image_base64?: string;
    image_url?: string;
    mask_base64?: string;
    mask_url?: string;
    model?: string;
    resolution?: string;
    ratio?: string;
}
export interface BlendImagesRequest {
    prompt: string;
    images_base64?: string[];
    images_url?: string[];
    model?: string;
    resolution?: string;
    ratio?: string;
}
export type SSEEvent = {
    type: "image";
    url: string;
} | {
    type: "error";
    message: string;
} | {
    type: "done";
};
/**
 * POST /api/v1/product/generate-images (SSE stream)
 * Yields events as they arrive: {type: "image", url} | {type: "error", message} | {type: "done"}
 */
export declare function generateImages(baseUrl: string, apiKey: string, req: GenerateImagesRequest): AsyncGenerator<SSEEvent>;
/**
 * POST /api/v1/product/generate-single-image
 */
export declare function generateSingleImage(baseUrl: string, apiKey: string, req: GenerateSingleImageRequest): Promise<string[]>;
/**
 * POST /api/v1/product/edit-image
 */
export declare function editImage(baseUrl: string, apiKey: string, req: EditImageRequest): Promise<string[]>;
/**
 * POST /api/v1/product/blend-images
 */
export declare function blendImages(baseUrl: string, apiKey: string, req: BlendImagesRequest): Promise<string[]>;
