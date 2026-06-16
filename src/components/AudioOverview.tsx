"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AudioClip,
  AudioOverviewResponse,
  DialogueSpeaker,
} from "@/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

const SPEAKER_LABEL: Record<DialogueSpeaker, string> = {
  A: "Host A",
  B: "Host B",
};

/**
 * Audio Overview: one click generates a two-host podcast (script + per-line
 * TTS) and plays the clips as a sequential browser playlist, highlighting the
 * line being spoken. Generation is the slow part — hence the loading state.
 */
export default function AudioOverview() {
  const [status, setStatus] = useState<Status>("idle");
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play whenever the current clip changes while in the playing state.
  useEffect(() => {
    if (isPlaying && clips.length > 0) {
      audioRef.current?.play().catch(() => undefined);
    }
  }, [current, isPlaying, clips.length]);

  async function generate() {
    if (status === "loading") return;
    setStatus("loading");
    setError(null);
    setClips([]);
    setIsPlaying(false);
    setFinished(false);
    setCurrent(0);

    try {
      const res = await fetch("/api/audio", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Audio Overview failed.");
      }
      setClips((json.data as AudioOverviewResponse).clips);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio Overview failed.");
      setStatus("error");
    }
  }

  function togglePlay() {
    if (clips.length === 0) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (finished) {
      setFinished(false);
      setCurrent(0);
    }
    setIsPlaying(true);
  }

  function playFrom(index: number) {
    setFinished(false);
    setCurrent(index);
    setIsPlaying(true);
  }

  function handleEnded() {
    if (current < clips.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setIsPlaying(false);
      setFinished(true);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Audio Overview
        </h3>
        {status === "ready" && (
          <button
            type="button"
            onClick={generate}
            className="rounded text-xs font-medium text-neutral-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Regenerate
          </button>
        )}
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <button
            type="button"
            onClick={generate}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f4ea66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
          >
            Generate Audio Overview
          </button>
          {status === "error" && error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </>
      ) : status === "loading" ? (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-card px-3 py-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
          </div>
          <p className="text-xs leading-relaxed text-neutral-400">
            Writing a two-host conversation and synthesizing each line… this
            calls TTS per line, so it takes a bit.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs text-black transition-colors hover:bg-[#f4ea66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="min-w-0 text-xs text-neutral-500">
              <div className="font-semibold text-white">
                {SPEAKER_LABEL[clips[current].speaker]}
              </div>
              <div>
                Line {current + 1} of {clips.length}
                {finished ? " · finished" : ""}
              </div>
            </div>
          </div>

          <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto pr-1">
            {clips.map((clip, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => playFrom(i)}
                  className={`block w-full rounded-md px-2 py-1.5 text-left text-xs leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    i === current
                      ? "bg-accent/20 text-white"
                      : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
                  }`}
                >
                  <span className="font-semibold text-white">
                    {SPEAKER_LABEL[clip.speaker]}:
                  </span>{" "}
                  {clip.text}
                </button>
              </li>
            ))}
          </ul>

          <audio
            ref={audioRef}
            src={clips[current]?.audio}
            onEnded={handleEnded}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
