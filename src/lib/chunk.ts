import type { ChunkInput } from "./types";

// Sentence-aware windowing. We split into sentences (keeping their exact char
// spans), then pack whole sentences up to a target size. Boundaries always fall
// on real sentence/paragraph ends, so a cited chunk highlights a clean passage
// rather than cutting mid-sentence.
//
// No overlap: because we never split a sentence, the usual reason for overlap
// (avoiding mid-idea cuts) is already covered. Overlap would duplicate a
// sentence across two numbered chunks, which made the model mis-attribute
// citations to a neighbour. Zero overlap → each sentence lives in exactly one
// chunk → unambiguous citation mapping.
const TARGET_CHARS = 800;
const OVERLAP_SENTENCES = 0;

interface Span {
  start: number;
  end: number;
}

const WHITESPACE = /\s/;
const TERMINATORS = new Set([".", "!", "?"]);

/** Trim leading/trailing whitespace from a span, returning adjusted offsets. */
function trimSpan(text: string, start: number, end: number): Span | null {
  let s = start;
  let e = end;
  while (s < e && WHITESPACE.test(text[s])) s += 1;
  while (e > s && WHITESPACE.test(text[e - 1])) e -= 1;
  return e > s ? { start: s, end: e } : null;
}

/**
 * Split text into sentence spans with exact offsets. Boundaries are:
 *  - sentence terminators (. ! ?) followed by whitespace/EOF, and
 *  - paragraph breaks (a blank line, i.e. two or more newlines).
 *
 * A *single* newline is treated as ordinary in-sentence whitespace — PDF text
 * wraps lines mid-sentence, so single line breaks must NOT end a sentence
 * (that was the bug behind mid-sentence highlights).
 *
 * Heuristic: decimals like "9.81" don't split (digit follows the dot), but
 * abbreviations like "e.g." may — acceptable for this scope.
 */
function splitSentences(text: string): Span[] {
  const spans: Span[] = [];
  const n = text.length;
  let start = 0;
  let i = 0;

  const push = (from: number, to: number) => {
    const trimmed = trimSpan(text, from, to);
    if (trimmed) spans.push(trimmed);
  };

  while (i < n) {
    const char = text[i];

    if (TERMINATORS.has(char)) {
      let j = i + 1;
      while (j < n && TERMINATORS.has(text[j])) j += 1; // e.g. "?!" or "..."
      if (j >= n || WHITESPACE.test(text[j])) {
        push(start, j);
        start = j;
        i = j;
        continue;
      }
    } else if (char === "\n") {
      // Scan the whitespace run; 2+ newlines means a paragraph break.
      let j = i + 1;
      let newlines = 1;
      while (j < n && WHITESPACE.test(text[j])) {
        if (text[j] === "\n") newlines += 1;
        j += 1;
      }
      if (newlines >= 2) {
        push(start, i);
        start = j;
        i = j;
        continue;
      }
      // Single newline: in-sentence whitespace, fall through.
    }

    i += 1;
  }

  if (start < n) push(start, n);
  return spans;
}

/**
 * Group sentences into overlapping chunks. Each chunk's content is an exact
 * slice of the source text, so offsets stay valid for highlighting.
 */
export function chunkText(text: string): ChunkInput[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: ChunkInput[] = [];
  let i = 0;
  let index = 0;

  while (i < sentences.length) {
    const chunkStart = sentences[i].start;
    let last = i;

    // Always include sentence i; extend while staying within the target.
    while (last + 1 < sentences.length) {
      const candidateEnd = sentences[last + 1].end;
      if (candidateEnd - chunkStart > TARGET_CHARS) break;
      last += 1;
    }

    const chunkEnd = sentences[last].end;
    chunks.push({
      content: text.slice(chunkStart, chunkEnd),
      startOffset: chunkStart,
      endOffset: chunkEnd,
      index: index++,
    });

    if (last + 1 >= sentences.length) break;
    // Step forward with a one-sentence overlap, guaranteeing progress.
    i = Math.max(i + 1, last + 1 - OVERLAP_SENTENCES);
  }

  return chunks;
}
