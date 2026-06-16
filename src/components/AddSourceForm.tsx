"use client";

import { useState } from "react";

interface AddSourceFormProps {
  onAdded: () => void;
  onCancel: () => void;
}

type Mode = "text" | "pdf";

/**
 * Inline form to add a source by pasting text or uploading a PDF. Posts a
 * multipart form to /api/sources, which runs the ingestion pipeline, then asks
 * the parent to refresh the list.
 */
export default function AddSourceForm({ onAdded, onCancel }: AddSourceFormProps) {
  const [mode, setMode] = useState<Mode>("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const form = new FormData();
      form.set("type", mode);
      form.set("title", title);
      if (mode === "text") {
        form.set("text", text);
      } else if (file) {
        form.set("file", file);
      }

      const res = await fetch("/api/sources", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to add source.");
      }

      setTitle("");
      setText("");
      setFile(null);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add source.");
    } finally {
      setSubmitting(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
    }`;

  const fieldClass =
    "rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-white transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-3 mb-2 flex flex-col gap-3 rounded-xl border border-line bg-card p-3"
    >
      <div className="flex gap-1 rounded-lg bg-black/40 p-1">
        <button
          type="button"
          className={tabClass(mode === "text")}
          onClick={() => setMode("text")}
        >
          Paste text
        </button>
        <button
          type="button"
          className={tabClass(mode === "pdf")}
          onClick={() => setMode("pdf")}
        >
          Upload PDF
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={mode === "pdf" ? "Title (optional)" : "Title"}
        className={fieldClass}
      />

      {mode === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your source text…"
          rows={6}
          className={`resize-y ${fieldClass}`}
        />
      ) : (
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black hover:file:bg-[#f4ea66]"
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#f4ea66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-40"
        >
          {submitting ? "Adding…" : "Add source"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-line bg-transparent px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
