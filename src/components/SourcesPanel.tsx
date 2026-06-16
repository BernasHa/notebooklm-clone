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
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-700">Sources</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white"
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

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-4 text-center text-sm text-neutral-400">Loading…</p>
        ) : error ? (
          <p className="p-4 text-center text-sm text-red-600">{error}</p>
        ) : sources.length === 0 ? (
          <p className="p-4 text-center text-sm text-neutral-400">
            No sources yet. Add a PDF or paste text to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sources.map((source) => (
              <li key={source.id}>
                <button
                  type="button"
                  onClick={() => onOpenSource(source.id)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-neutral-800">
                      {source.title}
                    </span>
                    <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-neutral-500">
                      {source.type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-400">
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
