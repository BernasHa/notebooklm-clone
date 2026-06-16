import { getDb } from "./db";
import { embedQuery } from "./embeddings";

/** A chunk retrieved by vector search, with the metadata needed to cite it. */
export interface RetrievedChunk {
  chunkId: number;
  sourceId: number;
  sourceTitle: string;
  content: string;
  startOffset: number;
  endOffset: number;
  distance: number;
}

const DEFAULT_K = 6;

// KNN runs in a CTE without joins (so the LIMIT is pushed into vec0), then we
// join chunk + source metadata onto the top-k rowids.
const SEARCH_SQL = `
WITH knn AS (
  SELECT rowid AS chunk_id, distance
  FROM vec_chunks
  WHERE embedding MATCH ?
  ORDER BY distance
  LIMIT ?
)
SELECT
  knn.chunk_id     AS chunkId,
  knn.distance     AS distance,
  c.source_id      AS sourceId,
  c.content        AS content,
  c.start_offset   AS startOffset,
  c.end_offset     AS endOffset,
  s.title          AS sourceTitle
FROM knn
JOIN chunks c  ON c.id = knn.chunk_id
JOIN sources s ON s.id = c.source_id
ORDER BY knn.distance
`;

/** Embed the query and return the top-k most similar chunks. */
export async function retrieveChunks(
  query: string,
  k: number = DEFAULT_K
): Promise<RetrievedChunk[]> {
  const db = getDb();
  const vector = await embedQuery(query);
  return db
    .prepare(SEARCH_SQL)
    .all(JSON.stringify(vector), k) as RetrievedChunk[];
}
