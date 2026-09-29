"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { searchContentAction } from "@/app/actions/content";
import { LEVEL_CODES } from "@/lib/content/constants";
import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";
import StatusBadge from "@/components/ui/StatusBadge";

// Searches the content library (any review state, archived excluded) for the lesson
// composer. Results come from an admin-only Server Action; picking only adds an id to
// the editor state, and the server re-checks every id when the lesson is saved.
export default function ContentPicker({ kind, label, defaultLevel, defaultSkill, pickedIds = [], onPick, actionLabel = "Add" }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState(defaultLevel ?? "");
  const [skill, setSkill] = useState(defaultSkill ?? "");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  function search() {
    startTransition(async () => {
      const res = await searchContentAction(kind, { q, level, skill: kind === "exercises" ? skill : undefined, topic: kind === "vocabulary" ? topic : undefined });
      setResult(res);
    });
  }

  // Search as the author types (debounced); the first search runs on mount.
  useEffect(() => {
    const t = setTimeout(search, first.current ? 0 : 300);
    first.current = false;
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, level, skill, topic]);

  const picked = new Set(pickedIds);
  const input = "rounded-md border border-line bg-surface px-2 py-1 text-sm";
  // Enter must search, not submit the surrounding editor form.
  const noSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  return (
    <div className="rounded-lg border border-line bg-canvas p-3" role="group" aria-label={label}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-40 flex-1 flex-col gap-0.5">
          <label htmlFor={`${id}-q`} className="text-xs font-medium">
            {label}
          </label>
          <input id={`${id}-q`} type="search" className={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={noSubmit} placeholder="Search by word, title or slug" />
        </div>
        <select aria-label="Level" className={input} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {LEVEL_CODES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {kind === "exercises" && (
          <select aria-label="Skill" className={input} value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">All skills</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {SKILL_LABELS[s].en}
              </option>
            ))}
          </select>
        )}
        {kind === "vocabulary" && (
          <input aria-label="Topic" className={`${input} w-32`} value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={noSubmit} placeholder="Topic slug" />
        )}
      </div>

      <div className="mt-2" aria-live="polite">
        {pending && !result && <p className="text-xs text-ink-muted">Searching…</p>}
        {result && !result.ok && <p className="text-xs text-danger-700">{result.message}</p>}
        {result?.ok && result.data.items.length === 0 && <p className="text-xs text-ink-muted">Nothing found.</p>}
        {result?.ok && result.data.items.length > 0 && (
          <ul className={`max-h-64 divide-y divide-line overflow-y-auto rounded-md border border-line bg-surface ${pending ? "opacity-60" : ""}`}>
            {result.data.items.map((o) => (
              <li key={o.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate" lang="de">
                    {o.label}
                    {o.meaning && <span className="text-ink-muted"> – {o.meaning}</span>}
                  </p>
                  <p className="truncate font-mono text-xs text-ink-muted">
                    {o.levelCode} · {o.slug}
                    {o.skill ? ` · ${o.skill}` : ""}
                  </p>
                </div>
                <StatusBadge status={o.reviewStatus} />
                <StatusBadge status={o.publishStatus} />
                <button
                  type="button"
                  disabled={picked.has(o.id)}
                  onClick={() => onPick(o)}
                  className="h-7 rounded-md border border-line px-2 text-xs font-medium hover:bg-brand-50 disabled:opacity-40"
                  aria-label={`${actionLabel} ${o.label}`}
                >
                  {picked.has(o.id) ? "Added" : actionLabel}
                </button>
              </li>
            ))}
          </ul>
        )}
        {result?.ok && result.data.total > result.data.items.length && (
          <p className="mt-1 text-xs text-ink-muted">Showing {result.data.items.length} of {result.data.total}. Refine the search to see more.</p>
        )}
      </div>
    </div>
  );
}
