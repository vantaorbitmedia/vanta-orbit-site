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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLeonardoRequestBody(prompt: string) {
  const body: Record<string, string | number> = {
    prompt,
    width: Number(process.env.LEONARDO_IMAGE_WIDTH || 1024),
    height: Number(process.env.LEONARDO_IMAGE_HEIGHT || 576),
    num_images: Number(process.env.LEONARDO_NUM_IMAGES || 1),
  };

  if (process.env.LEONARDO_MODEL_ID) {
    body.modelId = process.env.LEONARDO_MODEL_ID;
  }

  return body;
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

  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

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
      body: JSON.stringify(getLeonardoRequestBody(prompt)),
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
