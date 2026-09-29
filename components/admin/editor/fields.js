"use client";

import { createContext, useContext, useId } from "react";
import { LOCALE_LABELS } from "@/lib/i18n/locales";
import { LOCALES } from "@/components/admin/editor/payload";

// Form building blocks for the admin editors. Field errors come from the server (Zod
// issue paths such as "items.2.options") through ErrorsContext, so any field can show
// the messages for its own path without prop drilling.

export const ErrorsContext = createContext({});

export function useFieldErrors(path) {
  const errors = useContext(ErrorsContext);
  return path ? (errors[path] ?? []) : [];
}

const inputClass = (hasError) =>
  `w-full rounded-md border bg-surface px-2.5 py-1.5 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-canvas disabled:text-ink-muted ${
    hasError ? "border-danger-700" : "border-line"
  }`;

function Messages({ id, messages }) {
  if (!messages.length) return null;
  return (
    <p id={id} className="text-xs text-danger-700">
      {messages.join(" · ")}
    </p>
  );
}

function Wrapper({ id, label, hint, messages, children, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      <Messages id={`${id}-error`} messages={messages} />
    </div>
  );
}

function describedBy(id, hint, messages) {
  return [hint && `${id}-hint`, messages.length && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

export function TextInput({ label, value, onChange, path, hint, className, multiline = false, rows = 3, ...props }) {
  const id = useId();
  const messages = useFieldErrors(path);
  const common = {
    id,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    "aria-invalid": messages.length ? true : undefined,
    "aria-describedby": describedBy(id, hint, messages),
    className: inputClass(messages.length > 0),
    ...props,
  };
  return (
    <Wrapper id={id} label={label} hint={hint} messages={messages} className={className}>
      {multiline ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}
    </Wrapper>
  );
}

export function NumberInput(props) {
  return <TextInput inputMode="decimal" {...props} />;
}

export function Select({ label, value, onChange, options, path, hint, className, ...props }) {
  const id = useId();
  const messages = useFieldErrors(path);
  return (
    <Wrapper id={id} label={label} hint={hint} messages={messages} className={className}>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={messages.length ? true : undefined}
        aria-describedby={describedBy(id, hint, messages)}
        className={inputClass(messages.length > 0)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function Checkbox({ label, checked, onChange, hint }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
      <label htmlFor={id} className="text-sm">
        {label}
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </label>
    </div>
  );
}

// { de, en, bn } editor. `required` lists locales the schema requires (marked with *).
export function LocalizedInput({ label, value, onChange, path, required = [], multiline = false, rows = 3, locales = LOCALES, hint }) {
  const groupMessages = useFieldErrors(path);
  const errors = useContext(ErrorsContext);
  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-medium">
        {label}
        {required.length > 0 && <span className="font-normal text-ink-muted"> (required: {required.join(", ")})</span>}
      </legend>
      <div className={`mt-1 grid gap-2 ${multiline ? "" : "sm:grid-cols-3"}`}>
        {locales.map((loc) => {
          const messages = errors[`${path}.${loc}`] ?? [];
          return (
            <LocaleField
              key={loc}
              loc={loc}
              label={`${LOCALE_LABELS[loc]}${required.includes(loc) ? " *" : ""}`}
              value={value?.[loc] ?? ""}
              onChange={(v) => onChange({ ...value, [loc]: v })}
              messages={messages}
              multiline={multiline}
              rows={rows}
            />
          );
        })}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      <Messages messages={groupMessages} />
    </fieldset>
  );
}

function LocaleField({ loc, label, value, onChange, messages, multiline, rows }) {
  const id = useId();
  const common = {
    id,
    lang: loc,
    value,
    onChange: (e) => onChange(e.target.value),
    "aria-invalid": messages.length ? true : undefined,
    className: inputClass(messages.length > 0),
  };
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <label htmlFor={id} className="text-[11px] uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      {multiline ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}
      <Messages messages={messages} />
    </div>
  );
}

// Move up / move down / remove for a row in an editable list.
export function RowControls({ index, count, onMove, onRemove, label }) {
  const btn = "inline-flex h-7 min-w-7 items-center justify-center rounded border border-line bg-surface px-1.5 text-xs hover:bg-canvas disabled:opacity-40";
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${label} up`}>
        ↑
      </button>
      <button type="button" className={btn} onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label={`Move ${label} down`}>
        ↓
      </button>
      <button type="button" className={`${btn} text-danger-700`} onClick={() => onRemove(index)} aria-label={`Remove ${label}`}>
        ✕
      </button>
    </div>
  );
}

export function AddButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center rounded-md border border-dashed border-brand-600/50 px-3 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function Panel({ title, description, children, actions }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

// Immutable list helpers for editor state.
export const move = (list, index, delta) => {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
};
export const removeAt = (list, index) => list.filter((_, i) => i !== index);
export const replaceAt = (list, index, value) => list.map((v, i) => (i === index ? value : v));
