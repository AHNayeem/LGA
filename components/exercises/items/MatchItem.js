"use client";

import LocalizedText from "@/components/ui/LocalizedText";
import { pickText } from "@/lib/i18n/locales";

// One select per left entry: keyboard and screen-reader friendly, and works on phones.
export default function MatchItem({ item, value = {}, onChange, disabled, reveal, name }) {
  const labelFor = (id) => {
    const r = item.right.find((x) => x.id === id);
    return r ? pickText(r.text, "de").text : "";
  };
  return (
    <ul className="grid gap-2">
      {item.left.map((l) => {
        const chosen = value[l.id] ?? "";
        const expected = reveal?.pairs?.[l.id];
        const correct = reveal && chosen === expected;
        const selectId = `${name}-${l.id}`;
        return (
          <li
            key={l.id}
            className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 ${
              reveal ? (correct ? "border-success-700 bg-success-50" : "border-danger-700 bg-danger-50") : "border-line"
            }`}
          >
            <label htmlFor={selectId} className="min-w-28 flex-1 font-medium">
              <LocalizedText text={l.text} prefer="de" />
            </label>
            <select
              id={selectId}
              value={chosen}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, [l.id]: e.target.value })}
              className="h-11 min-w-40 flex-1 rounded-lg border border-line bg-surface px-3"
            >
              <option value="">Choose…</option>
              {item.right.map((r) => (
                <option key={r.id} value={r.id}>
                  {pickText(r.text, "de").text}
                </option>
              ))}
            </select>
            {reveal && !correct && (
              <span className="basis-full text-sm">
                Correct: <strong>{labelFor(expected)}</strong>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

MatchItem.isAnswered = (value, item) => item.left.every((l) => value?.[l.id]);
