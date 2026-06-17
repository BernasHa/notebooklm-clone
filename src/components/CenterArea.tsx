"use client";

import type { ReactNode } from "react";
import type { StudioKind, StudioTab } from "@/lib/types";
import StudioResult from "./StudioResult";

type CenterTab = "chat" | StudioKind;

interface CenterAreaProps {
  chat: ReactNode;
  tabs: StudioTab[];
  active: CenterTab;
  onSelect: (tab: CenterTab) => void;
  onClose: (kind: StudioKind) => void;
  /** Whether the center is the visible panel on narrow screens. */
  mobileActive: boolean;
}

interface TabButtonProps {
  label: string;
  active: boolean;
  loading?: boolean;
  onClick: () => void;
  onClose?: () => void;
}

function TabButton({ label, active, loading, onClick, onClose }: TabButtonProps) {
  return (
    <div
      className={`group flex items-center gap-1.5 border-b-2 px-1 ${
        active ? "border-accent" : "border-transparent"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active ? "text-white" : "text-neutral-500 hover:text-neutral-200"
        }`}
      >
        {loading && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-700 border-t-accent" />
        )}
        {label}
      </button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${label}`}
          className="rounded text-neutral-600 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="px-0.5 text-sm leading-none">×</span>
        </button>
      )}
    </div>
  );
}

/**
 * Center area with an in-app tab bar: a default "Chat" tab plus one tab per
 * generated Studio result. The chat element stays mounted (hidden when
 * inactive) so its state and the citation → highlight flow are never reset.
 */
export default function CenterArea({
  chat,
  tabs,
  active,
  onSelect,
  onClose,
  mobileActive,
}: CenterAreaProps) {
  return (
    <main
      className={`${
        mobileActive ? "flex" : "hidden"
      } h-full min-w-0 flex-1 flex-col bg-canvas lg:flex`}
    >
      <div className="flex items-center gap-1 border-b border-line px-3">
        <TabButton
          label="Chat"
          active={active === "chat"}
          onClick={() => onSelect("chat")}
        />
        {tabs.map((tab) => (
          <TabButton
            key={tab.kind}
            label={tab.label}
            active={active === tab.kind}
            loading={tab.loading}
            onClick={() => onSelect(tab.kind)}
            onClose={() => onClose(tab.kind)}
          />
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        <div className={active === "chat" ? "h-full" : "hidden"}>{chat}</div>
        {tabs.map((tab) => (
          <div
            key={tab.kind}
            className={active === tab.kind ? "h-full" : "hidden"}
          >
            <StudioResult tab={tab} />
          </div>
        ))}
      </div>
    </main>
  );
}
