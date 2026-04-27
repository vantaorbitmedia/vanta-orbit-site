import { resolveAllowedAiModel } from "@/lib/ai-models";
import { warnMissingServerEnv } from "@/lib/env";

type GenerateTextOptions = {
  instructions: string;
  input: string;
  maxOutputTokens?: number;
  model?: string;
  textFormat?: unknown;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function extractResponseText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .filter(Boolean)
    .join("\n")
    .trim() ?? "";
}

export function getAiModel() {
  return resolveAllowedAiModel();
}

export function isAiConfigured() {
  warnMissingServerEnv("OPENAI_API_KEY", "OpenAI generation");
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateAiText({
  instructions,
  input,
  maxOutputTokens = 1800,
  model,
  textFormat,
}: GenerateTextOptions) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const resolvedModel = resolveAllowedAiModel(model);
  const startedAt = Date.now();
  const requestBody: Record<string, unknown> = {
    model: resolvedModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
  };

  if (textFormat) {
    requestBody.text = { format: textFormat };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  const data = (await response.json()) as OpenAIResponse;
  console.info(
    `[ai] OpenAI Responses API ${response.ok ? "ok" : "failed"} model=${resolvedModel} status=${response.status} durationMs=${Date.now() - startedAt}`,
  );

  if (!response.ok) {
    throw new Error(data.error?.message || "AI generation failed.");
  }

  const text = extractResponseText(data);
  if (!text) {
    throw new Error("AI response did not include text output.");
  }

  return text;
}
