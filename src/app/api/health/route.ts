import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// better-sqlite3 is a native module — force the Node.js runtime, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Phase 0 smoke test: opens the SQLite database (creating it + running
 * migrations on first call), confirms the sqlite-vec extension loaded, and
 * reports row counts so the data layer can be verified before any LLM wiring.
 */
export async function GET() {
  try {
    const db = getDb();

    const { vec_version } = db
      .prepare("SELECT vec_version() AS vec_version")
      .get() as { vec_version: string };

    const count = (table: string): number =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number })
        .n;

    return NextResponse.json({
      ok: true,
      vecVersion: vec_version,
      counts: {
        notebooks: count("notebooks"),
        sources: count("sources"),
        chunks: count("chunks"),
        vecChunks: count("vec_chunks"),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
