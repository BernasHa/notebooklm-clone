/**
 * Next.js startup hook. Runs once when the server boots — used to seed the
 * example document into an empty database. Guarded to the Node.js runtime
 * (better-sqlite3 is native) and fully swallowed so a missing OPENAI_API_KEY or
 * any seed failure never blocks the app from starting.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { seedIfEmpty } = await import("./lib/seed");
    await seedIfEmpty();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[seed] skipped: ${message}`);
  }
}
