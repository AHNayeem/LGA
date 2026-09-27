// Labelled input with accessible error wiring (aria-invalid + aria-describedby).
export default function FormField({ label, name, type = "text", errors, hint, ...inputProps }) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = Boolean(errors?.length);
  const describedBy = [hint && hintId, hasError && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={`h-11 rounded-lg border bg-surface px-3 text-base outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${
          hasError ? "border-danger-700" : "border-line"
        }`}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-sm text-danger-700">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
