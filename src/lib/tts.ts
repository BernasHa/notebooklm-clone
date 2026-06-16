import { getOpenAI } from "./openai";
import type { DialogueLine, DialogueSpeaker } from "./types";

const TTS_MODEL = "gpt-4o-mini-tts";

// Two clearly distinct voices so the hosts are easy to tell apart.
const VOICES: Record<DialogueSpeaker, "onyx" | "nova"> = {
  A: "onyx",
  B: "nova",
};

// Generate in parallel, but in bounded batches so a long script doesn't fire
// 20 concurrent requests at the API.
const BATCH_SIZE = 6;

/** Synthesize one line to an mp3 data URI. */
async function synthesizeLine(line: DialogueLine): Promise<string> {
  const response = await getOpenAI().audio.speech.create({
    model: TTS_MODEL,
    voice: VOICES[line.speaker],
    input: line.text,
    response_format: "mp3",
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
}

/**
 * Synthesize all lines, preserving order, generated in parallel batches. The
 * returned array is aligned 1:1 with `lines`.
 */
export async function synthesizeLines(
  lines: DialogueLine[]
): Promise<string[]> {
  const audio: string[] = new Array(lines.length);

  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batch = lines.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(synthesizeLine));
    results.forEach((dataUri, j) => {
      audio[i + j] = dataUri;
    });
  }

  return audio;
}
