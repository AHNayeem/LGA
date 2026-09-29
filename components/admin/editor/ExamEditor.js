"use client";

import { useState } from "react";
import Link from "next/link";
import EditorShell from "@/components/admin/editor/EditorShell";
import ContentPicker from "@/components/admin/editor/ContentPicker";
import { AddButton, Checkbox, LocalizedInput, Panel, RowControls, Select, TextInput, move, removeAt, replaceAt, useFieldErrors } from "@/components/admin/editor/fields";
import { ProvenanceFields, TagsAndRefs } from "@/components/admin/editor/groups";
import { examPayload, examSectionState, examState, slugify } from "@/components/admin/editor/payload";
import { editHref } from "@/lib/content/adminSections";
import { EXAM_LIMITS, EXAM_REVIEW_POLICIES, EXAM_REVIEW_POLICY_LABELS, LEVEL_CODES } from "@/lib/content/constants";
import StatusBadge from "@/components/ui/StatusBadge";

// Exam editor: settings (duration, pass mark, review policy) and ordered sections that pick
// exercises from the library. Sections store only exercise ids; the questions are those
// exercises' items. The server checks every id on save and publish readiness on publish.

function ExerciseRow({ summary, id, index, count, onMove, onRemove }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-line px-2 py-1" data-testid="exam-exercise">
      <span className="w-6 text-xs tabular-nums text-ink-muted">{index + 1}.</span>
      <div className="min-w-0 flex-1">
        {summary ? (
          <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <Link href={editHref("exercises", summary.id)} className="truncate font-medium text-brand-700 hover:underline" lang="de" target="_blank">
              {summary.label}
            </Link>
            <span className="font-mono text-xs text-ink-muted">{summary.slug}</span>
            {summary.skill && <span className="text-xs text-ink-muted">{summary.skill}</span>}
            {summary.questions != null && <span className="text-xs tabular-nums text-ink-muted">{summary.questions} question(s)</span>}
            <StatusBadge status={summary.reviewStatus} />
            <StatusBadge status={summary.publishStatus} />
          </span>
        ) : (
          <span className="text-sm text-danger-700">
            Missing exercise <code className="font-mono text-xs">{id}</code>
          </span>
        )}
      </div>
      <RowControls index={index} count={count} label={summary?.label ?? "exercise"} onMove={onMove} onRemove={onRemove} />
    </li>
  );
}

function SectionEditor({ section, index, count, onChange, onMove, onRemove, related, remember, levelCode, usedIds }) {
  const path = `sections.${index}`;
  const set = (patch) => onChange({ ...section, ...patch });
  const idErrors = useFieldErrors(`${path}.exerciseIds`);
  const ids = section.exerciseIds;
  const canAdd = ids.length < EXAM_LIMITS.exercisesPerSection && usedIds.length < EXAM_LIMITS.exercises;
  return (
    <div className="rounded-xl border border-line bg-surface p-4" data-testid="exam-section">
      <div className="flex flex-wrap items-end gap-2">
        <h3 className="mr-auto text-sm font-semibold">Section {index + 1}</h3>
        <RowControls index={index} count={count} label={`section ${index + 1}`} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className="mt-3 space-y-3">
        <TextInput label="Key" className="font-mono sm:w-60" value={section.key} onChange={(v) => set({ key: v })} path={`${path}.key`} hint="Unique within the exam, e.g. hoeren." />
        <LocalizedInput label="Title" required={["de"]} value={section.title} onChange={(v) => set({ title: v })} path={`${path}.title`} />
        <LocalizedInput label="Instructions (optional)" multiline rows={2} value={section.instructions} onChange={(v) => set({ instructions: v })} path={`${path}.instructions`} />
        <div className="space-y-2">
          <p className="text-xs font-medium">
            Exercises <span className="font-normal text-ink-muted">({ids.length} of max. {EXAM_LIMITS.exercisesPerSection}). Every question must be scored automatically; speaking practice can&apos;t be used.</span>
          </p>
          {ids.length > 0 && (
            <ol className="space-y-1">
              {ids.map((id, i) => (
                <ExerciseRow
                  key={id}
                  id={id}
                  summary={related[id]}
                  index={i}
                  count={ids.length}
                  onMove={(idx, d) => set({ exerciseIds: move(ids, idx, d) })}
                  onRemove={(idx) => set({ exerciseIds: removeAt(ids, idx) })}
                />
              ))}
            </ol>
          )}
          {idErrors.length > 0 && <p className="text-xs text-danger-700">{idErrors.join(" · ")}</p>}
          {canAdd && (
            <ContentPicker
              kind="exercises"
              label="Add an exercise from the library"
              defaultLevel={levelCode}
              pickedIds={usedIds}
              onPick={(o) => {
                remember(o);
                set({ exerciseIds: [...ids, o.id] });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExamEditor({ item, references, related: initialRelated, defaults }) {
  const [s, setState] = useState(() => examState(item, defaults));
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const [related, setRelated] = useState(initialRelated ?? {});
  const remember = (o) => setRelated((r) => ({ ...r, [o.id]: { ...o, ...r[o.id] } }));
  const sections = s.sections;
  // An exercise may appear only once in an exam, so pickers mark every one already used.
  const used = new Set(sections.flatMap((sec) => sec.exerciseIds));
  const questions = [...used].reduce((n, id) => n + (related[id]?.questions ?? 0), 0);

  const addSection = () => {
    const taken = sections.map((sec) => sec.key);
    let key = `teil-${sections.length + 1}`;
    for (let n = sections.length + 1; taken.includes(key); n++) key = `teil-${n}`;
    set({ sections: [...sections, examSectionState({ key })] });
  };

  return (
    <EditorShell kind="exams" item={item} buildPayload={() => examPayload({ ...s, slug: s.slug || slugify(s.title.de) })}>
      <Panel title="Exam">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Level" value={s.levelCode} onChange={(v) => set({ levelCode: v })} options={LEVEL_CODES.map((c) => ({ value: c, label: c }))} path="levelCode" />
          <TextInput label="Order" inputMode="numeric" value={s.order} onChange={(v) => set({ order: v })} path="order" />
          <TextInput
            label="Slug"
            className="font-mono"
            value={s.slug}
            placeholder={slugify(s.title.de)}
            onChange={(v) => set({ slug: v })}
            path="slug"
            hint={item ? "Changing the slug changes the learner URL." : "Empty = generated from the German title."}
          />
        </div>
        <LocalizedInput label="Title" required={["de"]} value={s.title} onChange={(v) => set({ title: v })} path="title" />
        <LocalizedInput label="Description" multiline rows={2} value={s.description} onChange={(v) => set({ description: v })} path="description" />
        <LocalizedInput label="Instructions for learners" multiline rows={3} value={s.instructions} onChange={(v) => set({ instructions: v })} path="instructions" />
      </Panel>

      <Panel title="Rules" description="The server enforces the time limit and computes every score. The pass mark is the app's practice target, not an official Goethe pass mark.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Checkbox label="Timed exam" checked={s.timed} onChange={(v) => set({ timed: v })} />
            {s.timed && <TextInput label="Duration (minutes)" inputMode="numeric" value={s.durationMinutes} onChange={(v) => set({ durationMinutes: v })} path="durationMinutes" hint="1 to 240." />}
          </div>
          <TextInput label="Pass mark (%)" inputMode="decimal" value={s.passPercent} onChange={(v) => set({ passPercent: v })} path="passThreshold" hint="Share of all points needed to pass." />
          <Select
            label="After submitting, learners see"
            value={s.reviewPolicy}
            onChange={(v) => set({ reviewPolicy: v })}
            options={EXAM_REVIEW_POLICIES.map((p) => ({ value: p, label: EXAM_REVIEW_POLICY_LABELS[p] }))}
            path="reviewPolicy"
          />
        </div>
      </Panel>

      <section aria-labelledby="sections-heading" className="space-y-3">
        <div>
          <h2 id="sections-heading" className="text-sm font-semibold">
            Sections <span className="font-normal text-ink-muted">({sections.length} of max. {EXAM_LIMITS.sections} · {used.size} exercise(s) · {questions} question(s) known)</span>
          </h2>
          <p className="text-xs text-ink-muted">Learners go through the sections and exercises in this order. Question numbers run through the whole exam.</p>
        </div>
        {sections.length === 0 && <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-muted">No sections yet. Add the first one below.</p>}
        {sections.map((sec, i) => (
          <SectionEditor
            key={sec.uid}
            section={sec}
            index={i}
            count={sections.length}
            related={related}
            remember={remember}
            levelCode={s.levelCode}
            usedIds={[...used]}
            onChange={(v) => set({ sections: replaceAt(sections, i, v) })}
            onMove={(idx, d) => set({ sections: move(sections, idx, d) })}
            onRemove={(idx) => set({ sections: removeAt(sections, idx) })}
          />
        ))}
        <AddButton onClick={addSection} disabled={sections.length >= EXAM_LIMITS.sections}>
          + Add section
        </AddButton>
      </section>

      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}
