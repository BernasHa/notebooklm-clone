"use client";

import { useEffect, useRef, useState } from "react";
import type { Citation, ChatMessage, ChatResponse } from "@/lib/types";
import MessageContent from "./MessageContent";

interface ChatPanelProps {
  onCitationSelect?: (citation: Citation) => void;
}

/**
 * Center panel: grounded RAG chat. Posts the conversation to /api/chat and
 * renders the answer with inline citation chips. Citations resolve to exact
 * supporting passages (quote-located), so clicking a chip highlights the
 * sentence that backs the claim.
 */
export default function ChatPanel({ onCitationSelect }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    setError(null);
    setInput("");
    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(history);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Chat failed.");
      }
      const data = json.data as ChatResponse;
      setMessages([
        ...history,
        { role: "assistant", content: data.answer, citations: data.citations },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex h-full flex-1 flex-col bg-white">
      <header className="border-b border-neutral-200 px-6 py-3">
        <h2 className="text-sm font-semibold text-neutral-700">Chat</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !isLoading ? (
          <p className="mx-auto mt-10 max-w-md text-center text-sm text-neutral-400">
            Add sources, then ask a question. Answers come strictly from your
            sources, with citations you can click.
          </p>
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((message, i) => (
              <li
                key={i}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white"
                      : "max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-2 text-sm text-neutral-800"
                  }
                >
                  {message.role === "assistant" ? (
                    <MessageContent
                      content={message.content}
                      citations={message.citations ?? []}
                      onCitationSelect={onCitationSelect}
                    />
                  ) : (
                    message.content
                  )}
                </div>
              </li>
            ))}
            {isLoading && (
              <li className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-2 text-sm text-neutral-400">
                  Thinking…
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="px-6 pb-1 text-xs text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="border-t border-neutral-200 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask your sources…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
      </form>
    </main>
  );
}
