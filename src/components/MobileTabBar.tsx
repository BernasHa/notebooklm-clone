"use client";

import type { ReactNode } from "react";

export type MobileView = "sources" | "center" | "studio";

interface MobileTabBarProps {
  active: MobileView;
  onChange: (view: MobileView) => void;
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5",
};

const TABS: { view: MobileView; label: string; icon: ReactNode }[] = [
  {
    view: "sources",
    label: "Sources",
    icon: (
      <svg {...iconProps}>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    view: "center",
    label: "Chat",
    icon: (
      <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    view: "studio",
    label: "Studio",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l1.7 4.8L18.5 9l-4.8 1.2L12 15l-1.7-4.8L5.5 9l4.8-1.2z" />
        <path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
      </svg>
    ),
  },
];

/**
 * Bottom navigation for narrow screens — switches the single visible panel
 * (Sources / Chat / Studio). Hidden at `lg` and up, where all three panels show
 * side by side unchanged.
 */
export default function MobileTabBar({ active, onChange }: MobileTabBarProps) {
  return (
    <nav className="flex shrink-0 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => {
        const isActive = active === tab.view;
        return (
          <button
            key={tab.view}
            type="button"
            onClick={() => onChange(tab.view)}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
              isActive
                ? "text-accent"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
