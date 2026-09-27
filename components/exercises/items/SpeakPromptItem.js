"use client";

import LocalizedText from "@/components/ui/LocalizedText";
import AudioPlayer from "@/components/audio/AudioPlayer";

const RATINGS = [
  { value: "confident", label: "I could say it" },
  { value: "unsure", label: "With some help" },
  { value: "not_yet", label: "Not yet" },
];

// Speaking practice without recording (Phase 3 adds recording). Self-rating is stored
// but not scored.
export default function SpeakPromptItem({ item, value, onChange, disabled, reveal, name }) {
  return (
    <div>
      {item.cue && (
        <LocalizedText as="p" text={item.cue} prefer="de" className="rounded-lg border border-line bg-canvas px-3 py-2 font-medium" />
      )}
      <p className="mt-2 text-sm text-ink-muted">Say your answer out loud, then rate yourself.</p>
      <fieldset className="mt-2">
        <legend className="sr-only">How did it go?</legend>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <label
              key={r.value}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${
                value === r.value ? "border-brand-600 bg-brand-50" : "border-line hover:bg-canvas"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={value === r.value}
                disabled={disabled}
                onChange={() => onChange(r.value)}
                className="size-4 accent-brand-600"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      {reveal && (
        <div className="mt-3 rounded-lg border border-success-700/30 bg-success-50 p-3">
          <p className="text-xs font-medium uppercase text-success-700">Model answer</p>
          <LocalizedText as="p" text={reveal.modelAnswer} prefer="de" className="mt-1 font-medium" />
          {reveal.modelAudio && (
            <div className="mt-2">
              <AudioPlayer sources={[reveal.modelAudio]} label="Listen" size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SpeakPromptItem.isAnswered = (value) => typeof value === "string";
