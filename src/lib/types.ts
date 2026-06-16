/** Shared domain types for the ingestion pipeline and API layer. */

export type SourceType = "pdf" | "text";

/** A single chunk's text plus its char span into the parent source content. */
export interface ChunkInput {
  content: string;
  startOffset: number;
  endOffset: number;
  index: number;
}

/** Lightweight source record returned to the UI (no full content). */
export interface SourceSummary {
  id: number;
  title: string;
  type: SourceType;
  chunkCount: number;
  createdAt: string;
}

/** Full source record including content, for the source viewer. */
export interface SourceDetail {
  id: number;
  title: string;
  type: SourceType;
  content: string;
}

/**
 * A numbered citation. `number` is what the model writes inline as `[number]`.
 * The offsets point at the exact supporting passage in the source content:
 * `exact` is true when they were located by searching the model's verbatim
 * quote, false when we fell back to the retrieved chunk's bounds.
 */
export interface Citation {
  number: number;
  sourceId: number;
  sourceTitle: string;
  quote: string;
  snippet: string;
  startOffset: number;
  endOffset: number;
  exact: boolean;
}

/** A chat turn. Assistant turns carry the citations used to ground them. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

/** Full chat response: the grounded answer plus its resolved citations. */
export interface ChatResponse {
  answer: string;
  citations: Citation[];
}

/** One-click Studio generators, grounded in the whole notebook. */
export type StudioKind = "summary" | "study_guide" | "faq";

/** Studio generation result (Markdown). */
export interface StudioResponse {
  kind: StudioKind;
  content: string;
}
