"use client";

import type { StudioKind, StudioTab } from "@/lib/types";
import AudioOverview from "./AudioOverview";

/** The Studio generators, in display order. Reused by NotebookView for labels. */
export const STUDIO_ACTIONS: { kind: StudioKind; label: string }[] = [
  { kind: "summary", label: "Summary" },
  { kind: "study_guide", label: "Study Guide" },
  { kind: "faq", label: "FAQ" },
];

interface StudioPanelProps {
  tabs: StudioTab[];
  activeKind: StudioKind | null;
  onGenerate: (kind: StudioKind) => void;
}

/**
 * Right panel: the one-click generators (Summary / Study Guide / FAQ) and Audio
 * Overview. Generating a result opens/activates its tab in the center area —
 * the result itself is rendered there (StudioResult), not in this panel.
 */
export default function StudioPanel({
  tabs,
  activeKind,
  onGenerate,
}: StudioPanelProps) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-line bg-panel">
      <header className="flex items-center px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Studio
        </h2>
      </header>

      <AudioOverview />

      <div className="flex flex-col gap-1.5 border-b border-line p-4">
        {STUDIO_ACTIONS.map((action) => {
          const tab = tabs.find((t) => t.kind === action.kind);
          const loading = tab?.loading ?? false;
          const active = activeKind === action.kind;
          return (
            <button
              key={action.kind}
              type="button"
              onClick={() => onGenerate(action.kind)}
              disabled={loading}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 ${
                active
                  ? "border-accent bg-card text-white shadow-[inset_3px_0_0_0_var(--color-accent)]"
                  : "border-line bg-card text-neutral-300 hover:border-neutral-500 hover:text-white"
              }`}
            >
              <span>{action.label}</span>
              {loading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-700 border-t-accent" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs leading-relaxed text-neutral-500">
          Results open as tabs in the center, where you can read them and
          download a PDF.
        </p>
      </div>
    </aside>
  );
}
