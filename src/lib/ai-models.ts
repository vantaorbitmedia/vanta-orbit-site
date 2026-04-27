export function getConfiguredAiModels() {
  const configuredModels = [
    process.env.AI_MODELS,
    process.env.AI_MODEL_MAIN,
    process.env.AI_MODEL_PREMIUM,
    process.env.AI_MODEL_FAST,
    process.env.AI_MODEL,
  ]
    .filter(Boolean)
    .join(",");
  const models = (configuredModels || "gpt-5-mini")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(new Set(models));
}

export function getDefaultAiModel() {
  return getConfiguredAiModels()[0] ?? "gpt-5-mini";
}

export function resolveAllowedAiModel(requestedModel?: string | null) {
  const models = getConfiguredAiModels();

  if (requestedModel && models.includes(requestedModel)) {
    return requestedModel;
  }

  return getDefaultAiModel();
}
