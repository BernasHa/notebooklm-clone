"use client";

import { Fragment } from "react";
import type { Citation } from "@/lib/types";
import CitationChip from "./CitationChip";

interface MessageContentProps {
  content: string;
  citations: Citation[];
  onCitationSelect?: (citation: Citation) => void;
}

/**
 * Render assistant text, replacing each `[n]` marker with a CitationChip when a
 * matching citation exists. Unknown numbers are left as plain text.
 */
export default function MessageContent({
  content,
  citations,
  onCitationSelect,
}: MessageContentProps) {
  const byNumber = new Map(citations.map((c) => [c.number, c]));
  const nodes: React.ReactNode[] = [];

  // Fresh regex per call (the `g` flag carries mutable lastIndex state).
  const matches = content.matchAll(/\[(\d+)\]/g);
  let lastIndex = 0;
  let key = 0;

  for (const match of matches) {
    const start = match.index ?? 0;
    const citation = byNumber.get(Number(match[1]));

    if (start > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{content.slice(lastIndex, start)}</Fragment>
      );
    }
    if (citation) {
      nodes.push(
        <CitationChip
          key={key++}
          citation={citation}
          onSelect={onCitationSelect}
        />
      );
    } else {
      nodes.push(<Fragment key={key++}>{match[0]}</Fragment>);
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    nodes.push(<Fragment key={key++}>{content.slice(lastIndex)}</Fragment>);
  }

  return <span className="whitespace-pre-wrap">{nodes}</span>;
}
