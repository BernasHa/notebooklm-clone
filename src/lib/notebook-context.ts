import type { SourceDetail } from "./types";

// Cap concatenated context so a large notebook can't blow the token budget.
// ~48k chars ≈ 12k tokens, comfortable for gpt-4o-mini.
const DEFAULT_MAX_CHARS = 48000;

/**
 * Concatenate labelled source contents (whole notebook) up to a char budget.
 * Shared by the Studio generators and the audio-script generator.
 */
export function renderNotebookContext(
  sources: SourceDetail[],
  maxChars: number = DEFAULT_MAX_CHARS
): string {
  let out = "";
  for (const source of sources) {
    const block = `# Source: ${source.title}\n${source.content.trim()}\n\n`;
    if (out.length + block.length > maxChars) {
      out += block.slice(0, Math.max(0, maxChars - out.length));
      break;
    }
    out += block;
  }
  return out.trim();
}
