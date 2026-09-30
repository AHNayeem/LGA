"use client";

import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";
import { AddButton, Checkbox, Panel, RowControls, Select, TextInput, move, removeAt, replaceAt } from "@/components/admin/editor/fields";
import { uid } from "@/components/admin/editor/payload";
import { SOURCE_TYPE_OPTIONS } from "@/lib/content/constants";

// Field groups shared by several editors.

export function ProvenanceFields({ state, set }) {
  // Seeded structural records keep their special source types.
  const options = SOURCE_TYPE_OPTIONS.some((o) => o.value === state.sourceType)
    ? SOURCE_TYPE_OPTIONS
    : [{ value: state.sourceType, label: state.sourceType }, ...SOURCE_TYPE_OPTIONS];
  return (
    <Panel title="Provenance" description="Where this content comes from. AI-generated content shows a notice to learners.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Source type" value={state.sourceType} onChange={(v) => set({ sourceType: v })} options={options} path="sourceType" />
        <TextInput label="Source reference" value={state.sourceReference} onChange={(v) => set({ sourceReference: v })} path="sourceReference" />
      </div>
    </Panel>
  );
}

export function TagsAndRefs({ state, set, references }) {
  const refs = state.refs;
  const setRefs = (next) => set({ refs: next });
  const refOptions = [{ value: "", label: "Choose a reference…" }, ...references.map((r) => ({ value: r.id, label: `${r.label} (${r.kind})` }))];
  return (
    <Panel title="Tags and references" description="Reference links record curriculum alignment (book chapter, exam part). They never contain book content.">
      <TextInput label="Tags" hint="Lowercase slugs, separated by commas" value={state.tags} onChange={(v) => set({ tags: v })} path="tags" />
      <div className="space-y-2">
        {refs.map((r, i) => (
          <div key={r.uid} className="flex flex-wrap items-end gap-2">
            <Select
              className="min-w-56 flex-1"
              label={`Reference ${i + 1}`}
              value={r.referenceId}
              onChange={(v) => setRefs(replaceAt(refs, i, { ...r, referenceId: v }))}
              options={refOptions}
              path={`refs.${i}.referenceId`}
            />
            <TextInput
              className="min-w-40 flex-1"
              label="Note"
              value={r.note}
              onChange={(v) => setRefs(replaceAt(refs, i, { ...r, note: v }))}
              path={`refs.${i}.note`}
            />
            <RowControls index={i} count={refs.length} label={`reference ${i + 1}`} onMove={(idx, d) => setRefs(move(refs, idx, d))} onRemove={(idx) => setRefs(removeAt(refs, idx))} />
          </div>
        ))}
        <AddButton onClick={() => setRefs([...refs, { uid: uid(), referenceId: "", note: "" }])} disabled={refs.length >= 20}>
          + Add reference
        </AddButton>
      </div>
    </Panel>
  );
}

// Mastery thresholds (the app's learning targets, not Goethe pass criteria). Modules and
// lessons inherit from their parent; "remove" drops an inherited skill for this scope.
export function MasteryEditor({ value, onChange, scope }) {
  const canRemove = scope !== "level";
  const modes = [
    { value: "inherit", label: canRemove ? "Inherit" : "Not assessed" },
    { value: "set", label: canRemove ? "Override" : "Assessed" },
    ...(canRemove ? [{ value: "remove", label: "Not assessed here" }] : []),
  ];
  return (
    <Panel
      title="Mastery thresholds"
      description={
        canRemove
          ? `Overrides the rules inherited from the ${scope === "module" ? "level" : "level and module"}. Thresholds are the app's learning targets, not official Goethe criteria.`
          : "Per-skill learning targets for this level. Modules and lessons can override them."
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-ink-muted">
            <tr>
              <th scope="col" className="py-1 pr-2 font-medium">Skill</th>
              <th scope="col" className="py-1 pr-2 font-medium">Rule</th>
              <th scope="col" className="py-1 pr-2 font-medium">Threshold %</th>
              <th scope="col" className="py-1 font-medium">Required</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((skill) => {
              const r = value[skill];
              const set = (patch) => onChange({ ...value, [skill]: { ...r, ...patch } });
              return (
                <tr key={skill} className="border-t border-line">
                  <td className="py-1.5 pr-2">{SKILL_LABELS[skill].en}</td>
                  <td className="py-1.5 pr-2">
                    <Select aria-label={`${SKILL_LABELS[skill].en} rule`} value={r.mode} onChange={(v) => set({ mode: v, threshold: v === "set" && !r.threshold ? "70" : r.threshold })} options={modes} />
                  </td>
                  <td className="w-32 py-1.5 pr-2">
                    {r.mode === "set" && (
                      <TextInput
                        aria-label={`${SKILL_LABELS[skill].en} threshold`}
                        inputMode="decimal"
                        value={r.threshold}
                        onChange={(v) => set({ threshold: v })}
                        path={`mastery.skills.${skill}.threshold`}
                      />
                    )}
                  </td>
                  <td className="py-1.5">{r.mode === "set" && <Checkbox label="Required" checked={r.required} onChange={(v) => set({ required: v })} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
