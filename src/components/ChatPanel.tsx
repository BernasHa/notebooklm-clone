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
    <main className="flex h-full flex-1 flex-col bg-canvas">
      <header className="flex items-center px-6 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Chat
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {messages.length === 0 && !isLoading ? (
          <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-lg">
              💬
            </span>
            <p className="text-sm font-medium text-neutral-200">
              Ask your sources
            </p>
            <p className="text-sm leading-relaxed text-neutral-500">
              Answers come strictly from your sources, with citations you can
              click to jump to the exact passage.
            </p>
          </div>
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
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-neutral-800 px-4 py-2.5 text-sm leading-relaxed text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-card px-4 py-2.5 text-sm leading-relaxed text-neutral-200"
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
                <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-sm border border-line bg-card px-4 py-3 text-sm text-neutral-400">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                  </span>
                  Thinking…
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="px-6 pb-1 text-xs text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-1">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask your sources…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[#f4ea66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-40"
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
      </form>
    </main>
  );
}
