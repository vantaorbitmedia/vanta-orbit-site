import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { warnMissingServerEnv } from "@/lib/env";

type LeonardoCreateResponse = {
  sdGenerationJob?: {
    generationId?: string;
  };
  error?: string;
};

type LeonardoGenerationResponse = {
  generations_by_pk?: {
    status?: string;
    generated_images?: Array<{
      id?: string;
      url?: string;
    }>;
  };
  error?: string;
};

const LEONARDO_BASE_URL = "https://cloud.leonardo.ai/api/rest/v1";
const DEFAULT_MODEL_ID = "b2614463-296c-462a-9586-aafdb8f00e36";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function getLeonardoRequestBody(body: {
  prompt: string;
  negativePrompt?: string;
  width?: unknown;
  height?: unknown;
  numImages?: unknown;
  modelId?: unknown;
}) {
  const requestBody: Record<string, boolean | string | number> = {
    prompt: body.prompt,
    modelId: typeof body.modelId === "string" && body.modelId.trim()
      ? body.modelId.trim()
      : process.env.LEONARDO_MODEL_ID || DEFAULT_MODEL_ID,
    width: getInteger(body.width, 1024),
    height: getInteger(body.height, 1024),
    num_images: getInteger(body.numImages, 1),
    alchemy: false,
  };

  if (body.negativePrompt) {
    requestBody.negative_prompt = body.negativePrompt;
  }

  return requestBody;
}

function getLegacyLeonardoRequestBody(prompt: string) {
  return {
    prompt,
    modelId: process.env.LEONARDO_MODEL_ID || DEFAULT_MODEL_ID,
    width: Number(process.env.LEONARDO_IMAGE_WIDTH || 1024),
    height: Number(process.env.LEONARDO_IMAGE_HEIGHT || 576),
    num_images: Number(process.env.LEONARDO_NUM_IMAGES || 1),
    alchemy: false,
  };
}

async function fetchGeneration(apiKey: string, generationId: string) {
  const response = await fetch(`${LEONARDO_BASE_URL}/generations/${generationId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const data = (await response.json()) as LeonardoGenerationResponse;

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch Leonardo generation.");
  }

  return data.generations_by_pk;
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.LEONARDO_API_KEY;
  warnMissingServerEnv("LEONARDO_API_KEY", "Leonardo image generation");
  if (!apiKey) {
    return NextResponse.json(
      { error: "LEONARDO_API_KEY is not configured. Add it to your deployment environment." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    prompt?: string;
    negativePrompt?: string;
    width?: unknown;
    height?: unknown;
    numImages?: unknown;
    modelId?: unknown;
  };
  const prompt = body.prompt?.trim();
  const negativePrompt = body.negativePrompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  try {
    const createResponse = await fetch(`${LEONARDO_BASE_URL}/generations`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        body.width || body.height || body.numImages || body.modelId || negativePrompt
          ? getLeonardoRequestBody({ ...body, prompt, negativePrompt })
          : getLegacyLeonardoRequestBody(prompt),
      ),
    });
    const createData = (await createResponse.json()) as LeonardoCreateResponse;

    if (!createResponse.ok) {
      throw new Error(createData.error || "Leonardo image generation failed to start.");
    }

    const generationId = createData.sdGenerationJob?.generationId;
    if (!generationId) {
      throw new Error("Leonardo did not return a generation ID.");
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await sleep(2500);
      const generation = await fetchGeneration(apiKey, generationId);
      const status = generation?.status ?? "PENDING";
      const images = generation?.generated_images ?? [];

      if (status === "COMPLETE") {
        return NextResponse.json({
          generationId,
          status,
          images: images.map((image) => ({ id: image.id ?? "", url: image.url ?? "" })).filter((image) => image.url),
        });
      }

      if (status === "FAILED") {
        return NextResponse.json({ generationId, status, error: "Leonardo generation failed." }, { status: 502 });
      }
    }

    return NextResponse.json({
      generationId,
      status: "PENDING",
      images: [],
      message: "Generation is still pending. Leonardo may finish it shortly.",
    }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Leonardo image generation failed." },
      { status: 500 },
    );
  }
}
