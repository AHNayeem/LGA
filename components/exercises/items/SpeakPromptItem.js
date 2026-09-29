"use client";

import { useState, useTransition } from "react";
import LocalizedText from "@/components/ui/LocalizedText";
import AudioPlayer from "@/components/audio/AudioPlayer";
import VoiceRecorder from "@/components/audio/VoiceRecorder";
import { deleteRecordingAction } from "@/app/actions/learning";
import { uploadRecording } from "@/lib/media/recordingClient";

const RATINGS = [
  { value: "confident", label: "I could say it" },
  { value: "unsure", label: "With some help" },
  { value: "not_yet", label: "Not yet" },
];

// Speaking practice: optionally record the answer, listen back, then rate yourself.
// Practice only: nothing is scored and there is no automated pronunciation feedback.
//
// value = { selfRating?, take? }  (take = unsent recording from VoiceRecorder)
// The recording is uploaded by prepareAnswer when the exercise is submitted.

function PreviousRecording({ recording }) {
  const [state, setState] = useState("idle"); // idle | confirm | deleted
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  if (state === "deleted") return <p className="text-sm text-ink-muted">Recording deleted.</p>;

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteRecordingAction({ recordingId: recording.id });
      if (res.ok) setState("deleted");
      else setError(res.message);
    });
  }

  const btn = "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium disabled:opacity-60";
  return (
    <div className="rounded-lg border border-line bg-canvas p-3" data-testid="previous-recording">
      <p className="text-xs font-medium uppercase text-ink-muted">Your last submitted recording</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <audio controls preload="none" src={`/api/media/${recording.id}`} className="h-10 w-full max-w-xs" aria-label="Your last submitted recording" />
        {state === "confirm" ? (
          <>
            <button type="button" onClick={remove} disabled={pending} className={`${btn} border-danger-700 text-danger-700`}>
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setState("idle")} disabled={pending} className={`${btn} border-line bg-surface`}>
              Keep
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setState("confirm")} className={`${btn} border-line bg-surface hover:bg-canvas`}>
            Delete recording
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default function SpeakPromptItem({ item, value, onChange, disabled, reveal, name, context, submitted }) {
  const rating = typeof value === "string" ? value : value?.selfRating;
  const take = typeof value === "object" ? (value?.take ?? null) : null;
  const previous = context?.recordings?.[item.id] ?? null;
  const update = (patch) => onChange((v) => ({ ...(typeof v === "object" && v ? v : {}), ...patch }));

  return (
    <div className="space-y-3">
      {item.cue && (
        <LocalizedText as="p" text={item.cue} prefer="de" className="rounded-lg border border-line bg-canvas px-3 py-2 font-medium" />
      )}
      <p className="text-sm text-ink-muted">Say your answer out loud. You can record yourself and listen back. Then rate yourself.</p>

      {!submitted && (
        <VoiceRecorder
          take={take}
          onTake={(t) => update({ take: t })}
          maxSeconds={context?.recordingLimits?.maxSeconds}
          maxBytes={context?.recordingLimits?.maxBytes}
          disabled={disabled}
        />
      )}
      {submitted?.recording && <p className="text-sm text-success-700">✓ Recording saved privately to your account.</p>}
      {previous && !take && <PreviousRecording key={previous.id} recording={previous} />}

      <fieldset>
        <legend className="text-sm font-medium">How did it go?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <label
              key={r.value}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${
                rating === r.value ? "border-brand-600 bg-brand-50" : "border-line hover:bg-canvas"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={rating === r.value}
                disabled={disabled}
                onChange={() => update({ selfRating: r.value })}
                className="size-4 accent-brand-600"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      {reveal && (
        <div className="rounded-lg border border-success-700/30 bg-success-50 p-3">
          <p className="text-xs font-medium uppercase text-success-700">Model answer</p>
          <LocalizedText as="p" text={reveal.modelAnswer} prefer="de" className="mt-1 font-medium" />
          {reveal.modelAudio && (
            <div className="mt-2">
              <AudioPlayer sources={[reveal.modelAudio]} label="Listen" size="sm" />
            </div>
          )}
          <p className="mt-2 text-xs text-ink-muted">Compare your answer with the model yourself. Speaking practice is not scored.</p>
        </div>
      )}
    </div>
  );
}

SpeakPromptItem.isAnswered = (value) => typeof value === "string" || typeof value?.selfRating === "string";

// Turns the UI value into the submitted answer, uploading a new take first. The upload
// result is cached on the take, so retrying a failed submission doesn't upload twice.
SpeakPromptItem.prepareAnswer = async (value, { lessonId, exerciseId, itemId }) => {
  if (typeof value === "string") return value;
  const answer = { selfRating: value.selfRating };
  const take = value.take;
  if (take) {
    take.uploaded ??= await uploadRecording({ blob: take.blob, lessonId, exerciseId, itemId, durationSec: take.durationSec });
    answer.recordingId = take.uploaded.id;
  }
  return answer;
};
