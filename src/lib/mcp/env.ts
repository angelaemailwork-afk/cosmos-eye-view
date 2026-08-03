type RuntimeGlobals = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

export function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.process?.env?.[name];
}

export function nasaApiKey(): string {
  return runtimeEnv("NASA_API_KEY")?.trim() || "DEMO_KEY";
}