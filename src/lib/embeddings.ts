import { getOpenAI, EMBEDDING_MODEL } from "./openai";

// Keep request payloads modest; OpenAI accepts large batches but smaller ones
// are friendlier to rate limits and give clearer partial-failure boundaries.
const BATCH_SIZE = 64;

/**
 * Embed an ordered list of texts. The returned vectors are aligned 1:1 with the
 * input order, which the ingestion transaction relies on to pair each vector
 * with its chunk.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getOpenAI();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of response.data) {
      vectors.push(item.embedding);
    }
  }

  return vectors;
}

/** Embed a single query string for vector search. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
