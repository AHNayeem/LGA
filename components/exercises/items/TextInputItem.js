"use client";

import { useRef } from "react";

const SPECIAL = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"];

// Typed answer, optionally inside a sentence gap. Extra buttons insert German characters
// for learners without a German keyboard (ae/oe/ue/ss are accepted too).
export default function TextInputItem({ item, value = "", onChange, disabled, reveal, result, name }) {
  const ref = useRef(null);
  const inputId = `${name}-input`;

  function insert(ch) {
    const el = ref.current;
    if (!el) return onChange(value + ch);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  const wrong = reveal && result && !result.correct;
  const border = reveal ? (result?.correct ? "border-success-700 bg-success-50" : "border-danger-700 bg-danger-50") : "border-line";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-base" lang="de">
        {item.label && (
          <label htmlFor={inputId} className="min-w-32 font-medium">
            {item.label}
          </label>
        )}
        {item.before && <span>{item.before}</span>}
        <input
          id={inputId}
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={item.label ? undefined : "Your answer"}
          inputMode={item.inputMode === "numeric" ? "numeric" : item.inputMode === "email" ? "email" : "text"}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={200}
          className={`h-11 min-w-0 flex-1 basis-40 rounded-lg border px-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${border}`}
        />
        {item.after && <span>{item.after}</span>}
      </div>
      {!disabled && item.inputMode !== "numeric" && (
        <div className="mt-2 flex flex-wrap gap-1" aria-label="Insert German letters">
          {SPECIAL.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => insert(ch)}
              className="h-8 min-w-8 rounded-md border border-line bg-surface px-2 text-sm hover:bg-canvas"
              aria-label={`Insert ${ch}`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
      {wrong && (
        <p className="mt-2 text-sm">
          Correct answer: <strong lang="de">{reveal.answer}</strong>
        </p>
      )}
      {reveal && result?.feedback === "umlaut" && (
        <p className="mt-2 text-sm text-warning-700">
          Accepted. The correct spelling is <strong lang="de">{reveal.answer}</strong>.
        </p>
      )}
    </div>
  );
}

TextInputItem.isAnswered = (value) => typeof value === "string" && value.trim().length > 0;
