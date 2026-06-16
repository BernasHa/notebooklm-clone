import OpenAI from "openai";

/** OpenAI models used across the app. */
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const CHAT_MODEL = "gpt-4o-mini";

let cached: OpenAI | null = null;

/**
 * Lazily construct a singleton OpenAI client. Fails fast with a clear message
 * if the key is missing so routes can surface a useful 500 instead of a vague
 * SDK error.
 */
export function getOpenAI(): OpenAI {
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local and restart the dev server."
    );
  }

  cached = new OpenAI({ apiKey });
  return cached;
}
