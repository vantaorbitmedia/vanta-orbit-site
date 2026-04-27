import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { generateAiText, isAiConfigured } from "@/lib/server-ai";

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    prompt?: string;
    fallbackInsights?: unknown;
    model?: string;
  };

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      error: "OPENAI_API_KEY is not configured. Add it to your deployment environment.",
      fallbackInsights: body.fallbackInsights ?? null,
    }, { status: 503 });
  }

  try {
    const text = await generateAiText({
      instructions: "You analyse short-form hook performance and return clear, actionable creative strategy.",
      input: body.prompt,
      maxOutputTokens: 2600,
      model: body.model,
    });

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed." },
      { status: 500 },
    );
  }
}
