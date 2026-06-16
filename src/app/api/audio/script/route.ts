import { NextResponse } from "next/server";
import {
  getNotebookSourceContents,
  getOrCreateDefaultNotebook,
} from "@/lib/repository";
import { generateScript } from "@/lib/audio-script";
import type { AudioScript } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generate (only) the two-host podcast script from the notebook sources. Kept
 * separate from TTS so the script can be reviewed without spending TTS budget.
 */
export async function POST() {
  try {
    const notebookId = getOrCreateDefaultNotebook();
    const sources = getNotebookSourceContents(notebookId);
    if (sources.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Add a source first — Audio Overview needs sources." },
        { status: 400 }
      );
    }

    const data: AudioScript = { script: await generateScript(sources) };
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Script generation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
