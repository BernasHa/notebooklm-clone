"use client";

import { useEffect, useState } from "react";
import type {
  Citation,
  StudioKind,
  StudioResponse,
  StudioTab,
} from "@/lib/types";
import SourcesPanel, { type ViewerState } from "./SourcesPanel";
import ChatPanel from "./ChatPanel";
import StudioPanel, { STUDIO_ACTIONS } from "./StudioPanel";
import CenterArea from "./CenterArea";

type CenterTab = "chat" | StudioKind;

const STUDIO_LABELS = Object.fromEntries(
  STUDIO_ACTIONS.map((a) => [a.kind, a.label])
) as Record<StudioKind, string>;

/**
 * Client container that owns the shared state: the source viewer (driven by
 * chat citations) and the Studio result tabs shown in the center area.
 */
export default function NotebookView() {
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [studioTabs, setStudioTabs] = useState<StudioTab[]>([]);
  const [activeCenter, setActiveCenter] = useState<CenterTab>("chat");
  // Fresh start on every page load: clear the notebook's sources/chunks/vectors
  // before rendering the panels. Chat history and Studio tabs are client state,
  // so they reset naturally on reload.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/sources", { method: "DELETE" });
      } catch {
        // Ignore — still let the app render so it never hangs on reset.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCitationSelect(citation: Citation) {
    setViewer({
      sourceId: citation.sourceId,
      highlight: { start: citation.startOffset, end: citation.endOffset },
    });
  }

  async function generateStudio(kind: StudioKind) {
    setStudioTabs((prev) => {
      const fresh: StudioTab = {
        kind,
        label: STUDIO_LABELS[kind],
        content: null,
        loading: true,
        error: null,
      };
      return prev.some((t) => t.kind === kind)
        ? prev.map((t) => (t.kind === kind ? fresh : t))
        : [...prev, fresh];
    });
    setActiveCenter(kind);

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
      const content = (json.data as StudioResponse).content;
      setStudioTabs((prev) =>
        prev.map((t) => (t.kind === kind ? { ...t, content, loading: false } : t))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Studio generation failed.";
      setStudioTabs((prev) =>
        prev.map((t) =>
          t.kind === kind ? { ...t, loading: false, error: message } : t
        )
      );
    }
  }

  function closeTab(kind: StudioKind) {
    setStudioTabs((prev) => prev.filter((t) => t.kind !== kind));
    setActiveCenter((curr) => (curr === kind ? "chat" : curr));
  }

  const activeKind = activeCenter === "chat" ? null : activeCenter;

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas text-sm text-neutral-500">
        Preparing…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <SourcesPanel
        viewer={viewer}
        onOpenSource={(sourceId) => setViewer({ sourceId, highlight: null })}
        onCloseViewer={() => setViewer(null)}
      />
      <CenterArea
        chat={<ChatPanel onCitationSelect={handleCitationSelect} />}
        tabs={studioTabs}
        active={activeCenter}
        onSelect={setActiveCenter}
        onClose={closeTab}
      />
      <StudioPanel
        tabs={studioTabs}
        activeKind={activeKind}
        onGenerate={generateStudio}
      />
    </div>
  );
}
