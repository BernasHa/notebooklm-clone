import { getOrCreateDefaultNotebook, listSources } from "./repository";
import { ingestText } from "./ingest";
import { SEED_SOURCE_TEXT, SEED_SOURCE_TITLE } from "./seed-content";

/**
 * On a fresh database, ingest the example document so the deployed app has
 * content to show immediately. No-op once any source exists. Runs the normal
 * ingestion pipeline, so it needs OPENAI_API_KEY (embeddings); the caller is
 * expected to swallow errors so a missing key never blocks startup.
 */
export async function seedIfEmpty(): Promise<void> {
  const notebookId = getOrCreateDefaultNotebook();
  if (listSources(notebookId).length > 0) return;

  await ingestText({ title: SEED_SOURCE_TITLE, text: SEED_SOURCE_TEXT });
}
