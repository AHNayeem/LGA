"use client";

import { useEffect, useRef, useState } from "react";
import { pickRecorderMimeType } from "@/lib/media/recording";

// Records one take with MediaRecorder: record → stop (or cancel) → preview → record again.
// The take stays in the browser until the exercise is submitted; uploading happens in
// SpeakPromptItem.prepareAnswer. Nothing here analyses or scores the audio.
//
// A take is { blob, url, mimeType, durationSec }. Every failure is reported in the UI and
// never blocks the rest of the exercise: the learner can always answer by self-rating.

const MESSAGES = {
  unsupported: "Recording is not supported in this browser. You can still say your answer out loud and rate yourself.",
  format: "This browser can't record in a supported audio format. You can still say your answer out loud and rate yourself.",
  denied: "Microphone access was blocked. Allow it in your browser settings to record, or say your answer out loud and rate yourself.",
  noDevice: "No microphone was found. You can still say your answer out loud and rate yourself.",
  busy: "The microphone is being used by another app. Close it and try again.",
  empty: "Nothing was recorded. Please try again.",
  failed: "Recording failed. Please try again.",
};

function errorKey(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "noDevice";
    case "NotReadableError":
    case "TrackStartError":
      return "busy";
    default:
      return "failed";
  }
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function VoiceRecorder({ take, onTake, maxSeconds = 60, maxBytes = 2 * 1024 * 1024, disabled = false }) {
  const [support, setSupport] = useState(null); // null until checked on the client
  const [status, setStatus] = useState("idle"); // idle | starting | recording
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const rec = useRef({ recorder: null, stream: null, chunks: [], startedAt: 0, timer: null, discard: false });

  useEffect(() => {
    const hasApi = typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder === "function";
    const mime = hasApi ? pickRecorderMimeType((t) => window.MediaRecorder.isTypeSupported(t)) : null;
    // Reading browser capabilities has to wait until after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(!hasApi ? { ok: false, reason: "unsupported" } : !mime ? { ok: false, reason: "format" } : { ok: true, mime });
    const r = rec.current;
    return () => {
      r.discard = true;
      clearInterval(r.timer);
      if (r.recorder?.state === "recording") r.recorder.stop();
      r.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function releaseStream() {
    const r = rec.current;
    clearInterval(r.timer);
    r.stream?.getTracks().forEach((t) => t.stop());
    r.stream = null;
  }

  function finish() {
    const r = rec.current;
    releaseStream();
    setStatus("idle");
    if (r.discard) return;
    const durationSec = (Date.now() - r.startedAt) / 1000;
    const blob = new Blob(r.chunks, { type: r.recorder?.mimeType || support?.mime || "" });
    if (blob.size === 0) return setError(MESSAGES.empty);
    if (blob.size > maxBytes) return setError(`The recording is too large (max ${Math.round(maxBytes / 104857.6) / 10} MB). Please record a shorter answer.`);
    onTake({ blob, url: URL.createObjectURL(blob), mimeType: blob.type, durationSec: Math.min(durationSec, maxSeconds) });
  }

  async function start() {
    if (!support?.ok || status !== "idle") return;
    setError(null);
    setNotice(null);
    discardTake();
    setStatus("starting");
    const r = rec.current;
    try {
      r.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setStatus("idle");
      return setError(MESSAGES[errorKey(err)]);
    }
    try {
      r.recorder = new window.MediaRecorder(r.stream, { mimeType: support.mime });
    } catch {
      releaseStream();
      setStatus("idle");
      return setError(MESSAGES.format);
    }
    r.chunks = [];
    r.discard = false;
    r.recorder.ondataavailable = (e) => e.data?.size && r.chunks.push(e.data);
    r.recorder.onstop = finish;
    r.recorder.onerror = () => {
      r.discard = true;
      releaseStream();
      setStatus("idle");
      setError(MESSAGES.failed);
    };
    r.startedAt = Date.now();
    setElapsed(0);
    r.recorder.start(1000);
    setStatus("recording");
    r.timer = setInterval(() => {
      const s = (Date.now() - r.startedAt) / 1000;
      setElapsed(s);
      if (s >= maxSeconds && r.recorder?.state === "recording") {
        setNotice(`Recording stopped at the ${maxSeconds}-second limit.`);
        r.recorder.stop();
      }
    }, 250);
  }

  function stop({ discard = false } = {}) {
    const r = rec.current;
    r.discard = discard;
    if (r.recorder?.state === "recording") r.recorder.stop();
    else releaseStream();
    if (discard) setNotice("Recording cancelled.");
  }

  function discardTake() {
    if (take?.url) URL.revokeObjectURL(take.url);
    if (take) onTake(null);
  }

  if (support === null) return null;
  if (!support.ok) {
    return (
      <p role="status" className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted" data-testid="recorder-unavailable">
        {MESSAGES[support.reason]}
      </p>
    );
  }

  const btn = "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <div className="space-y-2" data-testid="voice-recorder">
      <div className="flex flex-wrap items-center gap-2">
        {status === "recording" ? (
          <>
            <button type="button" onClick={() => stop()} className={`${btn} bg-danger-700 text-white`}>
              <span aria-hidden="true">◼</span> Stop
            </button>
            <button type="button" onClick={() => stop({ discard: true })} className={`${btn} border border-line bg-surface hover:bg-canvas`}>
              Cancel
            </button>
            <span className="text-sm tabular-nums text-danger-700" aria-live="off">
              <span aria-hidden="true">● </span>
              {fmt(elapsed)} / {fmt(maxSeconds)}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={disabled || status === "starting"}
            className={`${btn} border border-brand-600/30 bg-brand-50 text-brand-700 hover:bg-brand-100`}
          >
            <span aria-hidden="true">●</span> {status === "starting" ? "Starting…" : take ? "Record again" : "Record your answer"}
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {status === "recording" ? "Recording started." : ""}
      </p>
      {take && status !== "recording" && (
        <div className="flex flex-wrap items-center gap-2">
          <audio controls src={take.url} className="h-10 w-full max-w-xs" aria-label="Your new recording" />
          {!disabled && (
            <button type="button" onClick={discardTake} className={`${btn} border border-line bg-surface text-sm hover:bg-canvas`}>
              Discard
            </button>
          )}
        </div>
      )}
      {notice && <p className="text-sm text-ink-muted" role="status">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
