import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { warnMissingServerEnv } from "@/lib/env";

const LEONARDO_PLATFORM_MODELS_URL = "https://cloud.leonardo.ai/api/rest/v1/platformModels";
const DEFAULT_MODEL_ID = "b2614463-296c-462a-9586-aafdb8f00e36";
const OPTIONS_TIMEOUT_MS = 6000;

const fallbackModels = [
  {
    id: DEFAULT_MODEL_ID,
    name: "Default Leonardo model",
    description: "Fallback model used when live Leonardo model options are unavailable.",
  },
];

type LeonardoModelOption = {
  id: string;
  name: string;
  description?: string;
};

function stringProperty(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  return "";
}

function collectArrayValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.values(value).flatMap((item) => collectArrayValues(item));
}

function normalizeModels(value: unknown): LeonardoModelOption[] {
  const seen = new Set<string>();

  return collectArrayValues(value)
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => {
      const id = stringProperty(item, ["id", "modelId", "model_id", "uuid"]);
      const name = stringProperty(item, ["name", "modelName", "displayName"]) || id;
      const description = stringProperty(item, ["description", "details"]);

      return { id, name, description };
    })
    .filter((model) => {
      if (!model.id || seen.has(model.id)) {
        return false;
      }

      seen.add(model.id);
      return true;
    })
    .slice(0, 40);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.LEONARDO_API_KEY;
  warnMissingServerEnv("LEONARDO_API_KEY", "Leonardo model options");

  if (!apiKey) {
    return NextResponse.json({
      models: fallbackModels,
      source: "fallback",
      warning: "LEONARDO_API_KEY is not configured, so live Leonardo model options are unavailable.",
    });
  }

  try {
    const response = await fetchWithTimeout(
      LEONARDO_PLATFORM_MODELS_URL,
      {
        headers: {
          authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
      },
      OPTIONS_TIMEOUT_MS,
    );
    const data = (await response.json()) as unknown;

    if (!response.ok) {
      return NextResponse.json({
        models: fallbackModels,
        source: "fallback",
        warning: "Leonardo model options could not be loaded.",
      });
    }

    const models = normalizeModels(data);

    return NextResponse.json({
      models: models.length > 0 ? models : fallbackModels,
      source: models.length > 0 ? "leonardo" : "fallback",
    });
  } catch {
    return NextResponse.json({
      models: fallbackModels,
      source: "fallback",
      warning: "Unable to reach Leonardo model options.",
    });
  }
}
