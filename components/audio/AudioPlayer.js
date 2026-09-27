"use client";

import { useEffect, useRef, useState } from "react";

// Plays one or more audio sources in sequence (a dialogue is several lines). A "play"
// is the whole sequence; `maxPlays` mirrors the exam rule (heard once / twice). This is
// a practice limit enforced in the browser, not a security boundary.
//
// Sources come from the server (lib/media/audioSource.js):
//   { type: "asset", url }                 pre-generated/recorded file
//   { type: "speech-synthesis", text }     development preview only
//   { type: "unavailable" }

function playAsset(url, audioRef) {
  return new Promise((resolve, reject) => {
    const a = new Audio(url);
    audioRef.current = a;
    a.onended = () => resolve();
    a.onerror = () => reject(new Error("Audio could not be loaded."));
    a.play().catch(reject);
  });
}

function speak(text, lang) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return reject(new Error("Speech is not supported."));
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang ?? "de-DE";
    u.rate = 0.9;
    u.onend = () => resolve();
    u.onerror = () => reject(new Error("Speech failed."));
    window.speechSynthesis.speak(u);
  });
}

export default function AudioPlayer({ sources, maxPlays = null, label = "Play audio", size = "md" }) {
  const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  if (list.length === 0 || list.some((s) => s.type === "unavailable")) {
    return <p className="text-sm text-ink-muted">Audio is not available yet.</p>;
  }

  const usesSpeech = list.some((s) => s.type === "speech-synthesis");
  const exhausted = maxPlays != null && plays >= maxPlays;

  async function play() {
    if (playing || exhausted) return;
    setPlaying(true);
    setError(null);
    try {
      for (const s of list) {
        if (s.type === "asset") await playAsset(s.url, audioRef);
        else await speak(s.text, s.lang);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPlaying(false);
      setPlays((p) => p + 1);
    }
  }

  const sizes = size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={play}
        disabled={playing || exhausted}
        className={`inline-flex items-center gap-2 rounded-lg border border-brand-600/30 bg-brand-50 font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 ${sizes}`}
      >
        <span aria-hidden="true">{playing ? "◼" : "▶"}</span>
        {playing ? "Playing…" : label}
      </button>
      {maxPlays != null && (
        <span className="text-xs text-ink-muted" data-testid="plays">
          {exhausted ? `Played ${plays} of ${maxPlays} times` : `${maxPlays - plays} of ${maxPlays} plays left`}
        </span>
      )}
      {usesSpeech && <span className="text-xs text-warning-700">Browser voice (development preview)</span>}
      {error && (
        <span role="alert" className="text-xs text-danger-700">
          {error}
        </span>
      )}
    </div>
  );
}
