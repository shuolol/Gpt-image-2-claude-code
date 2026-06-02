// Types matching huoke backend request/response schemas

interface HuokeResponse {
  code: number;
  msg: string;
  data?: string[];
}

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

export type SSEEvent =
  | { type: "image"; url: string }
  | { type: "error"; message: string }
  | { type: "done" };

function authHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  };
}

async function checkResponse(response: Response): Promise<HuokeResponse> {
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Huoke API error (${response.status}): ${errText}`);
  }
  const data = (await response.json()) as HuokeResponse;
  if (data.code !== 200) {
    throw new Error(data.msg ? `Huoke API error: ${data.msg}` : `Huoke API returned code ${data.code}`);
  }
  return data;
}

/**
 * POST /api/v1/product/generate-images (SSE stream)
 * Yields events as they arrive: {type: "image", url} | {type: "error", message} | {type: "done"}
 */
export async function* generateImages(
  baseUrl: string,
  apiKey: string,
  req: GenerateImagesRequest,
): AsyncGenerator<SSEEvent> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/product/generate-images`;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Huoke API error (${response.status}): ${errText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const text = await response.text();
    throw new Error(`Expected SSE stream, got: ${text.slice(0, 200)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let currentEvent = "";
      let currentData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData = line.slice(6).trim();
        } else if (line === "") {
          // Empty line = dispatch
          if (currentEvent === "image" && currentData) {
            yield { type: "image", url: currentData };
          } else if (currentEvent === "error" && currentData) {
            yield { type: "error", message: currentData };
          } else if (currentEvent === "done") {
            yield { type: "done" };
          }
          currentEvent = "";
          currentData = "";
        }
      }
    }
    // Flush any remaining partial event in buffer (stream ended mid-frame)
    if (buffer) {
      const lastLines = buffer.split("\n");
      let flushEvent = "";
      let flushData = "";
      for (const line of lastLines) {
        if (line.startsWith("event: ")) {
          flushEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          flushData = line.slice(6).trim();
        }
      }
      if (flushEvent === "image" && flushData) {
        yield { type: "image", url: flushData };
      } else if (flushEvent === "error" && flushData) {
        yield { type: "error", message: flushData };
      } else if (flushEvent === "done") {
        yield { type: "done" };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * POST /api/v1/product/generate-single-image
 */
export async function generateSingleImage(
  baseUrl: string,
  apiKey: string,
  req: GenerateSingleImageRequest,
): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/product/generate-single-image`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(req),
  });
  const data = await checkResponse(response);
  return data.data ?? [];
}

/**
 * POST /api/v1/product/edit-image
 */
export async function editImage(
  baseUrl: string,
  apiKey: string,
  req: EditImageRequest,
): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/product/edit-image`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(req),
  });
  const data = await checkResponse(response);
  return data.data ?? [];
}

/**
 * POST /api/v1/product/blend-images
 */
export async function blendImages(
  baseUrl: string,
  apiKey: string,
  req: BlendImagesRequest,
): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/product/blend-images`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(req),
  });
  const data = await checkResponse(response);
  return data.data ?? [];
}
