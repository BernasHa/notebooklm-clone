"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { StudioTab } from "@/lib/types";
import { exportStudioPdf } from "@/lib/pdf-export";

interface StudioResultProps {
  tab: StudioTab;
}

/**
 * Center-area view for a generated Studio result: title + Download PDF, with the
 * formatted Markdown in a comfortable reading column. Loading and error states
 * are per-tab.
 */
export default function StudioResult({ tab }: StudioResultProps) {
  const [exporting, setExporting] = useState(false);

  async function handleDownload() {
    if (!tab.content || exporting) return;
    setExporting(true);
    try {
      await exportStudioPdf(tab.label, tab.content);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between gap-2 border-b border-line px-6 py-3">
        <h2 className="text-sm font-semibold text-white">{tab.label}</h2>
        {tab.content && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="rounded-lg border border-line bg-transparent px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {exporting ? "Preparing…" : "↓ Download PDF"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab.loading ? (
          <p className="mx-auto flex max-w-2xl items-center gap-2 text-sm text-neutral-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-700 border-t-accent" />
            Generating {tab.label}…
          </p>
        ) : tab.error ? (
          <p className="mx-auto max-w-2xl text-sm text-red-400">{tab.error}</p>
        ) : (
          <div className="prose prose-invert prose-sm mx-auto max-w-2xl prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white prose-p:text-neutral-300 prose-strong:text-white prose-li:text-neutral-300 prose-a:text-accent">
            <ReactMarkdown>{tab.content ?? ""}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
