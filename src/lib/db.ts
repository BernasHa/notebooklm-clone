import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";

/**
 * Embedding dimensionality for OpenAI `text-embedding-3-small`.
 * The vec0 virtual table is declared with this fixed width.
 */
export const EMBEDDING_DIM = 1536;

// Data directory is configurable so a persistent volume can be mounted in
// production (e.g. Railway: mount a volume and set DATA_DIR=/data). Defaults to
// ./data, created automatically on first use.
const DB_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "notebooklm.db");

/**
 * Schema. `sources.content` holds the full extracted text so that a citation's
 * char offsets (chunks.start_offset/end_offset) can be resolved back to the
 * exact passage for click-to-highlight.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS notebooks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sources (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  notebook_id INTEGER NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('pdf', 'text')),
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chunks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id    INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  notebook_id  INTEGER NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sources_notebook ON sources(notebook_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_chunks_notebook ON chunks(notebook_id);
`;

// vec0 virtual table is created separately: its rowid is set to chunks.id at
// insert time, giving a cheap join from a vector hit back to chunk metadata.
const VEC_SCHEMA = `
CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
  embedding float[${EMBEDDING_DIM}]
);
`;

let cached: Database.Database | null = null;

function migrate(db: Database.Database): void {
  db.exec(SCHEMA);
  db.exec(VEC_SCHEMA);
}

/**
 * Lazily open a singleton connection. Loads the sqlite-vec extension, enables
 * foreign keys + WAL, and runs idempotent migrations on first use.
 */
export function getDb(): Database.Database {
  if (cached) return cached;

  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  sqliteVec.load(db);
  migrate(db);

  cached = db;
  return db;
}
