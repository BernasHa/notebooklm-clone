import NotebookView from "@/components/NotebookView";

/**
 * Notebook page: the NotebookLM three-panel layout — Sources | Chat | Studio.
 * The interactive panels live in the NotebookView client container, which owns
 * the shared state that links chat citations to the source viewer.
 */
export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
            <span className="h-2 w-2 rounded-[2px] bg-black" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            NotebookLM Clone
          </span>
        </div>
        <span className="h-4 w-px bg-line" />
        <span className="text-sm text-neutral-500">Untitled notebook</span>
      </header>

      <NotebookView />
    </div>
  );
}
