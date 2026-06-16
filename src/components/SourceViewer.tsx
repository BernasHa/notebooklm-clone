"use client";

import { useEffect, useRef, useState } from "react";
import type { SourceDetail } from "@/lib/types";

export interface HighlightRange {
  start: number;
  end: number;
}

interface SourceViewerProps {
  sourceId: number;
  highlight: HighlightRange | null;
  onClose: () => void;
}

interface LoadError {
  sourceId: number;
  message: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Renders a source's full text. When `highlight` is set, the exact char span is
 * wrapped in a <mark> and scrolled into view — this is the click-to-source jump.
 *
 * Load state is derived from the data (does `source`/`error` match the current
 * `sourceId`?) rather than reset on every change, which keeps setState out of
 * the effect body.
 */
export default function SourceViewer({
  sourceId,
  highlight,
  onClose,
}: SourceViewerProps) {
  const [source, setSource] = useState<SourceDetail | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/sources/${sourceId}`);
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Failed to load source.");
        }
        if (!cancelled) setSource(json.data as SourceDetail);
      } catch (err) {
        if (!cancelled) {
          setError({
            sourceId,
            message:
              err instanceof Error ? err.message : "Failed to load source.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  const isLoaded = source?.id === sourceId;
  const showError = error?.sourceId === sourceId;

  // Scroll the highlighted passage into view once the right content is ready.
  useEffect(() => {
    if (isLoaded && highlight) {
      markRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isLoaded, highlight]);

  const content = isLoaded ? source.content : "";
  const start = highlight ? clamp(highlight.start, 0, content.length) : 0;
  const end = highlight ? clamp(highlight.end, start, content.length) : 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-black hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ← Back
        </button>
        <h2 className="truncate text-sm font-semibold text-black">
          {isLoaded ? source.title : "Loading…"}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {showError ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : !isLoaded ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-700">
            {highlight ? (
              <>
                {content.slice(0, start)}
                <mark
                  ref={markRef}
                  className="rounded-[3px] bg-accent px-0.5 py-px font-medium text-black shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                >
                  {content.slice(start, end)}
                </mark>
                {content.slice(end)}
              </>
            ) : (
              content
            )}
          </p>
        )}
      </div>
    </div>
  );
}
