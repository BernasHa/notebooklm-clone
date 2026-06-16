import { NextResponse } from "next/server";
import {
  getNotebookSourceContents,
  getOrCreateDefaultNotebook,
} from "@/lib/repository";
import { generateScript } from "@/lib/audio-script";
import { synthesizeLines } from "@/lib/tts";
import type { AudioClip, AudioOverviewResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Script + ~20 TTS calls take a while; allow more than the default budget.
export const maxDuration = 60;

/**
 * Full Audio Overview: generate the two-host script, synthesize every line
 * (parallel batches), and return ordered clips as mp3 data URIs for browser
 * playlist playback.
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

    const script = await generateScript(sources);
    const audio = await synthesizeLines(script);
    const clips: AudioClip[] = script.map((line, i) => ({
      ...line,
      audio: audio[i],
    }));

    const data: AudioOverviewResponse = { clips };
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Audio Overview generation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
