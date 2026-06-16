"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { StudioKind, StudioResponse } from "@/lib/types";

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
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-neutral-200 bg-neutral-50">
      <header className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-700">Studio</h2>
      </header>

      <div className="flex flex-col gap-2 border-b border-neutral-200 p-4">
        {ACTIONS.map((action) => (
          <button
            key={action.kind}
            type="button"
            onClick={() => generate(action.kind)}
            disabled={loading}
            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium disabled:opacity-50 ${
              activeKind === action.kind
                ? "border-neutral-900 bg-white text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-neutral-400">
            Generating {activeKind ? labelFor(activeKind) : ""}…
          </p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : content ? (
          <div className="prose prose-sm max-w-none prose-headings:text-neutral-800 prose-p:text-neutral-700">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-400">
            Generate a Summary, Study Guide, or FAQ from your sources.
          </p>
        )}
      </div>
    </aside>
  );
}
