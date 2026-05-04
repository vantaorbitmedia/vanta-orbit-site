import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getDailyFactById, saveDailyFact } from "@/lib/daily-space-facts";
import { checkRateLimit } from "@/lib/server-rate-limit";

const LEONARDO_BASE_URL = "https://cloud.leonardo.ai/api/rest/v1";
const DEFAULT_MODEL_ID = "b2614463-296c-462a-9586-aafdb8f00e36";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type LeonardoCreateResponse = {
  sdGenerationJob?: {
    generationId?: string;
  };
  error?: string;
};

type LeonardoGenerationResponse = {
  generations_by_pk?: {
    status?: string;
    generated_images?: Array<{ id?: string; url?: string }>;
  };
  error?: string;
};

async function fetchGeneration(apiKey: string, generationId: string) {
  const response = await fetch(`${LEONARDO_BASE_URL}/generations/${generationId}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });
  const data = await response.json() as LeonardoGenerationResponse;

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch Leonardo generation.");
  }

  return data.generations_by_pk;
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit("generate-fact-image", 30, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many image generation requests. Try again later." }, { status: 429 });
  }

  const apiKey = process.env.LEONARDO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "LEONARDO_API_KEY is not configured." }, { status: 503 });
  }

  try {
    const body = await request.json() as { factId?: string; leonardo_prompt?: string };
    const prompt = body.leonardo_prompt?.trim() ?? "";

    if (!prompt) {
      return NextResponse.json({ error: "leonardo_prompt is required." }, { status: 400 });
    }

    const createResponse = await fetch(`${LEONARDO_BASE_URL}/generations`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        modelId: process.env.LEONARDO_MODEL_ID || DEFAULT_MODEL_ID,
        width: 832,
        height: 1472,
        num_images: 1,
        alchemy: false,
        negative_prompt: "text, labels, UI, overlays, watermark, low quality, distorted geometry",
      }),
    });
    const createData = await createResponse.json() as LeonardoCreateResponse;

    if (!createResponse.ok) {
      throw new Error(createData.error || "Leonardo image generation failed to start.");
    }

    const generationId = createData.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("Leonardo did not return a generation ID.");

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await sleep(2500);
      const generation = await fetchGeneration(apiKey, generationId);
      const imageUrl = generation?.generated_images?.find((image) => image.url)?.url ?? "";

      if (generation?.status === "COMPLETE" && imageUrl) {
        let fact = null;
        if (body.factId) {
          const existing = await getDailyFactById(body.factId);
          if (existing) {
            fact = await saveDailyFact({ ...existing, image_url: imageUrl });
          }
        }

        return NextResponse.json({ generationId, image_url: imageUrl, fact });
      }

      if (generation?.status === "FAILED") {
        throw new Error("Leonardo generation failed.");
      }
    }

    return NextResponse.json(
      { generationId, image_url: "", message: "Generation is still pending in Leonardo." },
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Leonardo image generation failed." },
      { status: 500 },
    );
  }
}
