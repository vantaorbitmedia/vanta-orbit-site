import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { warnMissingServerEnv } from "@/lib/env";

const LEONARDO_GENERATIONS_URL = "https://cloud.leonardo.ai/api/rest/v1/generations";
const DEFAULT_MODEL_ID = "b2614463-296c-462a-9586-aafdb8f00e36";

type GenerateRequestBody = {
  prompt?: unknown;
  negativePrompt?: unknown;
  width?: unknown;
  height?: unknown;
  numImages?: unknown;
  modelId?: unknown;
};

function getInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function getErrorMessage(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }

  return fallback;
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.LEONARDO_API_KEY;
  warnMissingServerEnv("LEONARDO_API_KEY", "Leonardo image generation");

  if (!apiKey) {
    return NextResponse.json(
      { error: "LEONARDO_API_KEY is not configured. Add it to your local or deployment environment." },
      { status: 503 },
    );
  }

  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const negativePrompt = typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const leonardoBody: Record<string, boolean | number | string> = {
    prompt,
    modelId: typeof body.modelId === "string" && body.modelId.trim()
      ? body.modelId.trim()
      : process.env.LEONARDO_MODEL_ID || DEFAULT_MODEL_ID,
    width: getInteger(body.width, 1024),
    height: getInteger(body.height, 1024),
    num_images: getInteger(body.numImages, 1),
    alchemy: false,
  };

  if (negativePrompt) {
    leonardoBody.negative_prompt = negativePrompt;
  }

  try {
    const response = await fetch(LEONARDO_GENERATIONS_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(leonardoBody),
    });

    const data = (await response.json()) as unknown;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: getErrorMessage(data, "Leonardo image generation request failed."),
          details: data,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Leonardo image generation API." },
      { status: 502 },
    );
  }
}
