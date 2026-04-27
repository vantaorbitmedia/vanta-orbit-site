import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { generateAiText, isAiConfigured } from "@/lib/server-ai";

type DeepDiveOutput = {
  deepDiveTitle: string;
  deepDiveContent: string;
  deepDiveMetaDescription: string;
};

const deepDiveJsonSchema = {
  type: "json_schema",
  name: "deep_dive_article",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["deepDiveTitle", "deepDiveMetaDescription", "deepDiveContent"],
    properties: {
      deepDiveTitle: { type: "string" },
      deepDiveMetaDescription: { type: "string" },
      deepDiveContent: { type: "string" },
    },
  },
};

function normalizeDeepDive(value: unknown): DeepDiveOutput | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const deepDiveTitle = typeof raw.deepDiveTitle === "string" ? raw.deepDiveTitle.trim() : "";
  const deepDiveContent = typeof raw.deepDiveContent === "string" ? raw.deepDiveContent.trim() : "";
  const deepDiveMetaDescription = typeof raw.deepDiveMetaDescription === "string"
    ? raw.deepDiveMetaDescription.trim()
    : typeof raw.metaDescription === "string"
      ? raw.metaDescription.trim()
      : "";

  if (!deepDiveTitle || !deepDiveMetaDescription || !deepDiveContent) return null;

  return {
    deepDiveTitle,
    deepDiveContent,
    deepDiveMetaDescription,
  };
}

function stripJsonFence(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    prompt?: string;
    fallbackTitle?: string;
    fallbackContent?: string;
    model?: string;
  };

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      error: "OPENAI_API_KEY is not configured. Add it to your deployment environment.",
      fallbackTitle: body.fallbackTitle ?? "",
      fallbackContent: body.fallbackContent ?? "",
    }, { status: 503 });
  }

  try {
    const text = await generateAiText({
      instructions: "You write cinematic, beginner-friendly space education deep dives from structured video metadata. Return valid JSON only with deepDiveTitle, deepDiveMetaDescription, and deepDiveContent. No markdown fences, explanations, or extra text.",
      input: body.prompt,
      maxOutputTokens: 6500,
      model: body.model,
      textFormat: deepDiveJsonSchema,
    });

    let parsed: unknown;
    try {
      const data = JSON.parse(stripJsonFence(text));
      parsed = data;
    } catch {
      return NextResponse.json({ rawOutput: text, validJSON: false });
    }

    const deepDive = normalizeDeepDive(parsed);
    if (!deepDive) {
      return NextResponse.json({ rawOutput: text, validJSON: false });
    }

    return NextResponse.json({ deepDive, validJSON: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed." },
      { status: 500 },
    );
  }
}
