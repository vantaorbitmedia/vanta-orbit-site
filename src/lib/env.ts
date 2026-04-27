const warnedMissingEnv = new Set<string>();

export function warnMissingServerEnv(variableName: string, featureName: string) {
  if (process.env.NODE_ENV === "production" || warnedMissingEnv.has(variableName)) {
    return;
  }

  if (!process.env[variableName]) {
    warnedMissingEnv.add(variableName);
    console.warn(`[env] ${variableName} is not configured. ${featureName} will be disabled until it is set.`);
  }
}
