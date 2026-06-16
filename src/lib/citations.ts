import { getSourceDetail } from "./repository";
import { locateQuote } from "./quote-locator";
import type { RetrievedChunk } from "./retrieval";
import type { Citation } from "./types";

/** Raw citation as returned by the model's structured output. */
export interface RawCitation {
  marker: number;
  sourceId: number;
  quote: string;
}

const SNIPPET_CHARS = 220;

interface SourceText {
  title: string;
  content: string;
}

function makeCitation(
  marker: number,
  sourceId: number,
  sourceTitle: string,
  quote: string,
  start: number,
  end: number,
  exact: boolean
): Citation {
  return {
    number: marker,
    sourceId,
    sourceTitle,
    quote,
    snippet: quote.trim().slice(0, SNIPPET_CHARS),
    startOffset: start,
    endOffset: end,
    exact,
  };
}

/**
 * Resolve a model citation to exact char offsets by locating its verbatim quote
 * in the source text. Resolution order:
 *  1. search the quote in the stated source,
 *  2. search across the other retrieved sources (recovers a wrong sourceId),
 *  3. fall back to the retrieved chunk's bounds (chunk-accurate, `exact:false`).
 */
function resolveOne(
  item: RawCitation,
  chunks: RetrievedChunk[],
  retrievedSourceIds: number[],
  getSource: (id: number) => SourceText | null
): Citation | null {
  const stated = getSource(item.sourceId);
  if (stated) {
    const match = locateQuote(stated.content, item.quote);
    if (match) {
      return makeCitation(
        item.marker,
        item.sourceId,
        stated.title,
        item.quote,
        match.start,
        match.end,
        true
      );
    }
  }

  for (const sourceId of retrievedSourceIds) {
    if (sourceId === item.sourceId) continue;
    const source = getSource(sourceId);
    if (!source) continue;
    const match = locateQuote(source.content, item.quote);
    if (match) {
      return makeCitation(
        item.marker,
        sourceId,
        source.title,
        item.quote,
        match.start,
        match.end,
        true
      );
    }
  }

  const fallback =
    chunks.find((chunk) => chunk.sourceId === item.sourceId) ?? chunks[0];
  if (!fallback) return null;

  return makeCitation(
    item.marker,
    fallback.sourceId,
    fallback.sourceTitle,
    item.quote,
    fallback.startOffset,
    fallback.endOffset,
    false
  );
}

/** Resolve all model citations against the retrieved chunks. */
export function resolveCitations(
  raw: RawCitation[],
  chunks: RetrievedChunk[]
): Citation[] {
  const cache = new Map<number, SourceText | null>();
  const getSource = (id: number): SourceText | null => {
    if (!cache.has(id)) {
      const detail = getSourceDetail(id);
      cache.set(id, detail ? { title: detail.title, content: detail.content } : null);
    }
    return cache.get(id) ?? null;
  };

  const retrievedSourceIds = [...new Set(chunks.map((chunk) => chunk.sourceId))];

  return raw
    .map((item) => resolveOne(item, chunks, retrievedSourceIds, getSource))
    .filter((citation): citation is Citation => citation !== null);
}
