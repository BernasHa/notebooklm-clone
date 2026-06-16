import { getDb } from "./db";
import type {
  ChunkInput,
  SourceDetail,
  SourceSummary,
  SourceType,
} from "./types";

/**
 * MVP uses a single default notebook (multi-notebook UI is out of scope — see
 * README). This returns its id, creating it on first use.
 */
export function getOrCreateDefaultNotebook(): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM notebooks ORDER BY id LIMIT 1")
    .get() as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db
    .prepare("INSERT INTO notebooks (title) VALUES (?)")
    .run("My Notebook");
  return Number(result.lastInsertRowid);
}

interface CreateSourceArgs {
  notebookId: number;
  title: string;
  type: SourceType;
  content: string;
  chunks: ChunkInput[];
  embeddings: number[][];
}

/**
 * Persist a source plus its chunks and vectors atomically. Each chunk's vector
 * is stored in vec_chunks under the same rowid as the chunk, giving a cheap
 * join from a vector hit back to chunk metadata at query time.
 */
export function createSourceWithChunks(args: CreateSourceArgs): SourceSummary {
  const db = getDb();

  const insertSource = db.prepare(
    "INSERT INTO sources (notebook_id, title, type, content) VALUES (?, ?, ?, ?)"
  );
  const insertChunk = db.prepare(
    `INSERT INTO chunks (source_id, notebook_id, chunk_index, content, start_offset, end_offset)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertVec = db.prepare(
    "INSERT INTO vec_chunks (rowid, embedding) VALUES (?, ?)"
  );

  const run = db.transaction((): number => {
    const sourceResult = insertSource.run(
      args.notebookId,
      args.title,
      args.type,
      args.content
    );
    const sourceId = Number(sourceResult.lastInsertRowid);

    args.chunks.forEach((chunk, i) => {
      const chunkResult = insertChunk.run(
        sourceId,
        args.notebookId,
        chunk.index,
        chunk.content,
        chunk.startOffset,
        chunk.endOffset
      );
      const chunkId = Number(chunkResult.lastInsertRowid);
      // sqlite-vec requires a strict INTEGER rowid; bind as BigInt so
      // better-sqlite3 never coerces it to a float. The embedding is passed as
      // a JSON array of floats, which vec0 accepts.
      insertVec.run(BigInt(chunkId), JSON.stringify(args.embeddings[i]));
    });

    return sourceId;
  });

  const sourceId = run();
  return getSourceSummary(sourceId);
}

const SOURCE_SUMMARY_COLUMNS = `
  s.id            AS id,
  s.title         AS title,
  s.type          AS type,
  s.created_at    AS createdAt,
  (SELECT COUNT(*) FROM chunks c WHERE c.source_id = s.id) AS chunkCount
`;

/** Single source summary by id. */
export function getSourceSummary(id: number): SourceSummary {
  const db = getDb();
  return db
    .prepare(`SELECT ${SOURCE_SUMMARY_COLUMNS} FROM sources s WHERE s.id = ?`)
    .get(id) as SourceSummary;
}

/** Full source incl. content, for the source viewer / highlight jumps. */
export function getSourceDetail(id: number): SourceDetail | undefined {
  const db = getDb();
  return db
    .prepare("SELECT id, title, type, content FROM sources WHERE id = ?")
    .get(id) as SourceDetail | undefined;
}

/** All sources (incl. full content) for a notebook — used by Studio generators. */
export function getNotebookSourceContents(notebookId: number): SourceDetail[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, title, type, content FROM sources WHERE notebook_id = ? ORDER BY id"
    )
    .all(notebookId) as SourceDetail[];
}

/** All sources for a notebook, newest first. */
export function listSources(notebookId: number): SourceSummary[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT ${SOURCE_SUMMARY_COLUMNS}
       FROM sources s WHERE s.notebook_id = ? ORDER BY s.id DESC`
    )
    .all(notebookId) as SourceSummary[];
}
