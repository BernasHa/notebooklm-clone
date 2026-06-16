"use client";

import { useState } from "react";
import type { Citation } from "@/lib/types";
import SourcesPanel, { type ViewerState } from "./SourcesPanel";
import ChatPanel from "./ChatPanel";
import StudioPanel from "./StudioPanel";

/**
 * Client container that owns the shared viewer state, connecting the chat's
 * citation clicks to the source viewer in the left panel.
 */
export default function NotebookView() {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  function handleCitationSelect(citation: Citation) {
    setViewer({
      sourceId: citation.sourceId,
      highlight: { start: citation.startOffset, end: citation.endOffset },
    });
  }

  return (
    <div className="flex min-h-0 flex-1">
      <SourcesPanel
        viewer={viewer}
        onOpenSource={(sourceId) => setViewer({ sourceId, highlight: null })}
        onCloseViewer={() => setViewer(null)}
      />
      <ChatPanel onCitationSelect={handleCitationSelect} />
      <StudioPanel />
    </div>
  );
}
