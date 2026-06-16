"use client";

import type { Citation } from "@/lib/types";

interface CitationChipProps {
  citation: Citation;
  onSelect?: (citation: Citation) => void;
}

/**
 * Inline citation marker rendered in place of `[n]`. Hover shows the source +
 * verbatim quote; clicking highlights that passage in the source viewer.
 *
 * Two meanings, distinguished by fill (not just colour, so it survives the
 * black/white palette): an exact quote-located citation is a solid black chip;
 * a fallback to the retrieved chunk's bounds is a dashed outline chip.
 */
export default function CitationChip({ citation, onSelect }: CitationChipProps) {
  const tooltip = `${citation.sourceTitle} — "${citation.snippet}"${
    citation.exact ? "" : " (approx.)"
  }`;
  const tone = citation.exact
    ? "bg-white text-black hover:bg-neutral-300"
    : "border border-dashed border-neutral-600 bg-transparent text-neutral-400 hover:border-white hover:text-white";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(citation)}
      title={tooltip}
      className={`mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-md px-1 align-[1px] text-[10px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${tone}`}
    >
      {citation.number}
    </button>
  );
}
