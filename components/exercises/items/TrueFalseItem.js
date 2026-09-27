"use client";

import LocalizedText from "@/components/ui/LocalizedText";

const CHOICES = [
  { value: true, de: "richtig", en: "true" },
  { value: false, de: "falsch", en: "false" },
];

export default function TrueFalseItem({ item, value, onChange, disabled, reveal, name }) {
  return (
    <div>
      <LocalizedText as="p" text={item.statement} prefer="de" className="font-medium" />
      <div className="mt-3 flex flex-wrap gap-2">
        {CHOICES.map((c) => {
          const selected = value === c.value;
          const isAnswer = reveal && reveal.answer === c.value;
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
            <label key={c.de} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 ${tone}`}>
              <input
                type="radio"
                name={name}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(c.value)}
                className="size-4 accent-brand-600"
              />
              <span lang="de" className="font-medium">
                {c.de}
              </span>
              <span className="text-xs text-ink-muted">({c.en})</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

TrueFalseItem.isAnswered = (value) => typeof value === "boolean";
