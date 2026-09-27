"use client";

import LocalizedText from "@/components/ui/LocalizedText";

// Single choice. After submission the correct option is marked, and the learner's
// wrong choice (if any) too.
export default function McqItem({ item, value, onChange, disabled, reveal, name }) {
  return (
    <div className="grid gap-2">
      {item.options.map((o, i) => {
        const selected = value === o.id;
        const isAnswer = reveal && reveal.answer === o.id;
        const tone = reveal
          ? isAnswer
            ? "border-success-700 bg-success-50"
            : selected
              ? "border-danger-700 bg-danger-50"
              : "border-line"
          : selected
            ? "border-brand-600 bg-brand-50"
            : "border-line hover:bg-canvas";
        return (
          <label key={o.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${tone} ${disabled ? "cursor-default" : ""}`}>
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(o.id)}
              className="size-4 accent-brand-600"
            />
            <span className="w-5 text-sm font-semibold text-ink-muted">{String.fromCharCode(97 + i)}</span>
            <LocalizedText text={o.text} prefer="de" />
            {reveal && isAnswer && <span className="ml-auto text-xs font-medium text-success-700">correct answer</span>}
          </label>
        );
      })}
    </div>
  );
}

McqItem.isAnswered = (value) => typeof value === "string" && value.length > 0;
