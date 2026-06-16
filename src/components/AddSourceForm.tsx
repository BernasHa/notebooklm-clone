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
      active
        ? "bg-black text-white shadow-sm"
        : "text-neutral-500 hover:text-black"
    }`;

  const fieldClass =
    "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-black transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-black focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-3 mb-2 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3"
    >
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
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
          className="text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-800"
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          {submitting ? "Adding…" : "Add source"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-black hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
