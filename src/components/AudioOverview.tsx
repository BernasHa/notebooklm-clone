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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Audio Overview
        </h3>
        {status === "ready" && (
          <button
            type="button"
            onClick={generate}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
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
            className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Generate Audio Overview
          </button>
          {status === "error" && error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </>
      ) : status === "loading" ? (
        <p className="text-sm text-neutral-400">
          Generating a two-host conversation and synthesizing each line… this
          calls TTS per line, so it takes a bit.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="min-w-0 text-xs text-neutral-500">
              <div className="font-medium text-neutral-700">
                {SPEAKER_LABEL[clips[current].speaker]}
              </div>
              <div>
                Line {current + 1} of {clips.length}
                {finished ? " · finished" : ""}
              </div>
            </div>
          </div>

          <ul className="mt-1 max-h-48 overflow-y-auto pr-1">
            {clips.map((clip, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => playFrom(i)}
                  className={`block w-full rounded px-2 py-1 text-left text-xs ${
                    i === current
                      ? "bg-blue-50 text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  <span className="font-semibold">
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
