"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { StudioKind, StudioResponse } from "@/lib/types";
import AudioOverview from "./AudioOverview";

const ACTIONS: { kind: StudioKind; label: string }[] = [
  { kind: "summary", label: "Summary" },
  { kind: "study_guide", label: "Study Guide" },
  { kind: "faq", label: "FAQ" },
];

function labelFor(kind: StudioKind): string {
  return ACTIONS.find((a) => a.kind === kind)?.label ?? "";
}

/**
 * Right panel: one-click Studio generators (Summary / Study Guide / FAQ). Each
 * posts to /api/studio, which generates Markdown grounded in the whole notebook,
 * rendered here.
 */
export default function StudioPanel() {
  const [activeKind, setActiveKind] = useState<StudioKind | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(kind: StudioKind) {
    if (loading) return;
    setActiveKind(kind);
    setContent("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Studio generation failed.");
      }
      setContent((json.data as StudioResponse).content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Studio generation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-line bg-panel">
      <header className="flex items-center px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Studio
        </h2>
      </header>

      <AudioOverview />

      <div className="flex flex-col gap-1.5 border-b border-line p-4">
        {ACTIONS.map((action) => {
          const active = activeKind === action.kind;
          return (
            <button
              key={action.kind}
              type="button"
              onClick={() => generate(action.kind)}
              disabled={loading}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
                active
                  ? "border-accent bg-card text-white shadow-[inset_3px_0_0_0_var(--color-accent)]"
                  : "border-line bg-card text-neutral-300 hover:border-neutral-500 hover:text-white"
              }`}
            >
              {action.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-700 border-t-accent" />
            Generating {activeKind ? labelFor(activeKind) : ""}…
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white prose-p:text-neutral-300 prose-strong:text-white prose-li:text-neutral-300 prose-a:text-accent">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 py-10 text-center">
            <p className="text-sm font-medium text-neutral-300">
              Study material
            </p>
            <p className="text-xs leading-relaxed text-neutral-500">
              Generate a Summary, Study Guide, or FAQ from your sources.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
