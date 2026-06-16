"use client";

import type { Citation } from "@/lib/types";

interface CitationChipProps {
  citation: Citation;
  onSelect?: (citation: Citation) => void;
}

/**
 * Inline citation marker rendered in place of `[n]`. Hover shows the source +
 * the verbatim quote; clicking highlights that passage in the source viewer.
 * Exact (quote-located) citations are blue; amber marks a fallback to the
 * retrieved chunk's bounds when the quote couldn't be located verbatim.
 */
export default function CitationChip({ citation, onSelect }: CitationChipProps) {
  const tooltip = `${citation.sourceTitle} — "${citation.snippet}"${
    citation.exact ? "" : " (approx.)"
  }`;
  const tone = citation.exact
    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
    : "bg-amber-100 text-amber-700 hover:bg-amber-200";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(citation)}
      title={tooltip}
      className={`mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 align-baseline text-[10px] font-semibold ${tone}`}
    >
      {citation.number}
    </button>
  );
}
