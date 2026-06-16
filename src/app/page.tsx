import NotebookView from "@/components/NotebookView";

/**
 * Notebook page: the NotebookLM three-panel layout — Sources | Chat | Studio.
 * The interactive panels live in the NotebookView client container, which owns
 * the shared state that links chat citations to the source viewer.
 */
export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-neutral-200 bg-white px-6 py-3">
        <span className="text-base font-semibold text-neutral-900">
          NotebookLM Clone
        </span>
        <span className="text-sm text-neutral-400">/ Untitled notebook</span>
      </header>

      <NotebookView />
    </div>
  );
}
