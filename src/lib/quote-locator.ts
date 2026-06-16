export interface QuoteMatch {
  start: number;
  end: number;
}

const WHITESPACE_RUN = /\s+/g;

// A fuzzy anchor needs at least this many consecutive verbatim words, so a
// short common phrase can't mislocate the highlight.
const MIN_RUN_WORDS = 4;

/** Collapse every whitespace run to a single space. */
function collapseWhitespace(text: string): string {
  return text.replace(WHITESPACE_RUN, " ");
}

function isWhitespace(char: string | undefined): boolean {
  return char !== undefined && /\s/.test(char);
}

function isTerminator(char: string): boolean {
  return char === "." || char === "!" || char === "?";
}

/**
 * Collapse whitespace while recording, for each char in the normalized string,
 * the index of the corresponding char in the original. A whitespace run maps to
 * the index of its first char.
 */
function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < text.length; i += 1) {
    if (isWhitespace(text[i])) {
      if (!inWhitespace) {
        normalized += " ";
        map.push(i);
        inWhitespace = true;
      }
    } else {
      normalized += text[i];
      map.push(i);
      inWhitespace = false;
    }
  }

  return { normalized, map };
}

/** Map a [normStart, normEnd) span back to an original-content char span. */
function toOriginalSpan(
  map: number[],
  normStart: number,
  normLen: number
): QuoteMatch {
  const start = map[normStart];
  const end = map[normStart + normLen - 1] + 1;
  return { start, end };
}

/** Exact verbatim match of the normalized quote. */
function locateExact(
  normalized: string,
  map: number[],
  needle: string
): QuoteMatch | null {
  const idx = normalized.indexOf(needle);
  if (idx === -1) return null;
  return toOriginalSpan(map, idx, needle.length);
}

/**
 * Expand a char span to the sentence(s) it overlaps: walk left to the start of
 * the sentence and right to the next terminator. Used after a fuzzy anchor so
 * the highlight is a clean, complete supporting sentence.
 */
function snapToSentence(
  content: string,
  anchorStart: number,
  anchorEnd: number
): QuoteMatch {
  let start = 0;
  for (let j = anchorStart - 1; j > 0; j -= 1) {
    if (isTerminator(content[j]) && isWhitespace(content[j + 1])) {
      start = j + 1;
      break;
    }
  }
  while (start < anchorStart && isWhitespace(content[start])) start += 1;

  let end = content.length;
  for (let j = Math.max(anchorEnd - 1, 0); j < content.length; j += 1) {
    if (
      isTerminator(content[j]) &&
      (j + 1 >= content.length || isWhitespace(content[j + 1]))
    ) {
      end = j + 1;
      break;
    }
  }

  return { start, end };
}

/**
 * Fuzzy fallback: find the longest run of consecutive quote words that appears
 * verbatim in the source, then snap it to sentence boundaries. Handles the model
 * lightly altering the quote's edges (truncating, appending a period, etc.).
 */
function locateFuzzy(
  content: string,
  normalized: string,
  map: number[],
  needle: string
): QuoteMatch | null {
  const words = needle.split(" ").filter(Boolean);
  let best: { normIdx: number; normLen: number; count: number } | null = null;

  for (let from = 0; from <= words.length - MIN_RUN_WORDS; from += 1) {
    for (let to = words.length; to - from >= MIN_RUN_WORDS; to -= 1) {
      const run = words.slice(from, to).join(" ");
      const idx = normalized.indexOf(run);
      if (idx !== -1) {
        const count = to - from;
        if (!best || count > best.count) {
          best = { normIdx: idx, normLen: run.length, count };
        }
        break; // longest run for this start found
      }
    }
  }

  if (!best) return null;
  const anchor = toOriginalSpan(map, best.normIdx, best.normLen);
  return snapToSentence(content, anchor.start, anchor.end);
}

/**
 * Find a quote inside source content and return its char span in the ORIGINAL
 * content, or null. Tries an exact (whitespace-tolerant) match first, then a
 * fuzzy word-run anchor snapped to sentence bounds. On multiple exact matches
 * the first is returned.
 */
export function locateQuote(content: string, quote: string): QuoteMatch | null {
  const needle = collapseWhitespace(quote).trim();
  if (needle.length === 0) return null;

  const { normalized, map } = normalizeWithMap(content);
  return (
    locateExact(normalized, map, needle) ??
    locateFuzzy(content, normalized, map, needle)
  );
}
