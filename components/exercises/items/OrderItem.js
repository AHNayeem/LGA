"use client";

// Sentence building: tap words in order; tap a placed word to put it back.
export default function OrderItem({ item, value = [], onChange, disabled, reveal, result }) {
  const placed = value.map((id) => item.tokens.find((t) => t.id === id)).filter(Boolean);
  const remaining = item.tokens.filter((t) => !value.includes(t.id));

  return (
    <div lang="de">
      <div
        className={`flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-dashed p-2 ${
          reveal ? (result?.correct ? "border-success-700 bg-success-50" : "border-danger-700 bg-danger-50") : "border-line bg-canvas"
        }`}
        role="group"
        aria-label="Your sentence"
        aria-live="polite"
      >
        {placed.length === 0 && <span className="px-1 text-sm text-ink-muted">Tap the words below in the right order.</span>}
        {placed.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value.filter((id) => id !== t.id))}
            className="h-10 rounded-md border border-brand-600/40 bg-surface px-3 font-medium disabled:cursor-default"
            aria-label={`Remove ${t.text}`}
          >
            {t.text}
          </button>
        ))}
      </div>
      {!disabled && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Words">
          {remaining.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange([...value, t.id])}
              className="h-10 rounded-md border border-line bg-surface px-3 font-medium hover:bg-brand-50"
            >
              {t.text}
            </button>
          ))}
        </div>
      )}
      {reveal && !result?.correct && (
        <p className="mt-2 text-sm">
          Correct: <strong>{reveal.answer}</strong>
        </p>
      )}
    </div>
  );
}

OrderItem.isAnswered = (value, item) => Array.isArray(value) && value.length === item.tokens.length;
