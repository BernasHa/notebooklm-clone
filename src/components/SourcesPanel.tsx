"use client";

import { useEffect, useState } from "react";
import type { SourceSummary } from "@/lib/types";
import AddSourceForm from "./AddSourceForm";
import SourceViewer, { type HighlightRange } from "./SourceViewer";

export interface ViewerState {
  sourceId: number;
  highlight: HighlightRange | null;
}

interface SourcesPanelProps {
  viewer: ViewerState | null;
  onOpenSource: (sourceId: number) => void;
  onCloseViewer: () => void;
}

/**
 * Left panel. Shows the source list + add form, or — when a source is open
 * (from a list click or a citation) — the SourceViewer with the highlighted
 * passage. Viewer state is owned by the parent so citations can drive it.
 */
export default function SourcesPanel({
  viewer,
  onOpenSource,
  onCloseViewer,
}: SourcesPanelProps) {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/sources");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Failed to load sources.");
        }
        if (cancelled) return;
        setSources(json.data as SourceSummary[]);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load sources."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function handleAdded() {
    setShowForm(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  if (viewer) {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <SourceViewer
          sourceId={viewer.sourceId}
          highlight={viewer.highlight}
          onClose={onCloseViewer}
        />
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Sources
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-black px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {showForm ? "Close" : "+ Add"}
        </button>
      </header>

      {showForm && (
        <AddSourceForm
          onAdded={handleAdded}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <p className="px-2 py-6 text-center text-sm text-neutral-400">
            Loading…
          </p>
        ) : error ? (
          <p className="px-2 py-6 text-center text-sm text-red-600">{error}</p>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No sources yet
            </p>
            <p className="text-xs leading-relaxed text-neutral-400">
              Add a PDF or paste text to get started.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sources.map((source) => (
              <li key={source.id}>
                <button
                  type="button"
                  onClick={() => onOpenSource(source.id)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-black">
                      {source.title}
                    </span>
                    <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                      {source.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {source.chunkCount}{" "}
                    {source.chunkCount === 1 ? "chunk" : "chunks"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
