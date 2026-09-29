"use client";

import { useState } from "react";
import Link from "next/link";
import EditorShell from "@/components/admin/editor/EditorShell";
import ContentPicker from "@/components/admin/editor/ContentPicker";
import ImageAttachment, { useImageLibrary } from "@/components/admin/editor/ImageAttachment";
import { AddButton, LocalizedInput, Panel, RowControls, Select, TextInput, move, removeAt, replaceAt, useFieldErrors } from "@/components/admin/editor/fields";
import { MasteryEditor, ProvenanceFields, TagsAndRefs } from "@/components/admin/editor/groups";
import { blockState, lessonPayload, lessonState, slugify, suggestBlockKey } from "@/components/admin/editor/payload";
import { editHref } from "@/lib/content/adminSections";
import { EXERCISE_BLOCK_TYPES, LESSON_BLOCK_TYPES } from "@/lib/content/constants";
import StatusBadge from "@/components/ui/StatusBadge";

// Lesson editor with the block composer. Blocks store only ids (vocabIds / refId); the
// words, grammar topics and exercises themselves live in their libraries.

const BLOCK_LABELS = {
  intro: "Intro text",
  vocabulary: "Vocabulary (flashcards)",
  grammar: "Grammar topic",
  reading: "Reading exercise",
  listening: "Listening exercise",
  speaking: "Speaking practice",
  writing: "Writing exercise",
  practice: "Practice exercise",
  mini_test: "Mini test",
  mastery_check: "Mastery check",
};
const SKILL_FOR_BLOCK = { reading: "reading", listening: "listening", speaking: "speaking", writing: "writing" };
const kindForBlock = (type) => (type === "grammar" ? "grammarTopics" : type === "vocabulary" ? "vocabulary" : "exercises");

function LinkedItem({ summary, id, kind, children }) {
  if (!summary) {
    return (
      <span className="text-sm text-danger-700">
        Missing item <code className="font-mono text-xs">{id}</code>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
      <Link href={editHref(kind, summary.id)} className="truncate font-medium text-brand-700 hover:underline" lang="de" target="_blank">
        {summary.label}
      </Link>
      <span className="font-mono text-xs text-ink-muted">{summary.slug}</span>
      {summary.skill && <span className="text-xs text-ink-muted">{summary.skill}</span>}
      <StatusBadge status={summary.reviewStatus} />
      <StatusBadge status={summary.publishStatus} />
      {children}
    </span>
  );
}

function BlockEditor({ block, index, count, onChange, onMove, onRemove, related, remember, levelCode, library }) {
  const path = `blocks.${index}`;
  const set = (patch) => onChange({ ...block, ...patch });
  const kind = kindForBlock(block.type);
  const refErrors = useFieldErrors(`${path}.refId`);
  const vocabErrors = useFieldErrors(`${path}.vocabIds`);
  const isExercise = EXERCISE_BLOCK_TYPES.includes(block.type);

  return (
    <div className="rounded-xl border border-line bg-surface p-4" data-testid="lesson-block">
      <div className="flex flex-wrap items-end gap-2">
        <h3 className="mr-auto text-sm font-semibold">
          Block {index + 1} · {BLOCK_LABELS[block.type]}
        </h3>
        <RowControls index={index} count={count} label={`block ${index + 1}`} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
          <Select
            label="Block type"
            value={block.type}
            onChange={(v) => set({ type: v, ...(kindForBlock(v) !== kind ? { refId: "", vocabIds: [] } : {}) })}
            options={LESSON_BLOCK_TYPES.map((t) => ({ value: t, label: BLOCK_LABELS[t] }))}
            path={`${path}.type`}
          />
          <TextInput
            label="Key"
            className="font-mono"
            value={block.key}
            onChange={(v) => set({ key: v })}
            path={`${path}.key`}
            disabled={block.persisted}
            hint={block.persisted ? "Locked: learner progress is stored per key." : "Stable id within the lesson."}
          />
        </div>
        <LocalizedInput label="Block title (optional)" value={block.title} onChange={(v) => set({ title: v })} path={`${path}.title`} />

        {block.type === "intro" && (
          <>
            <LocalizedInput label="Text" hint="At least one language is required." multiline rows={5} value={block.body} onChange={(v) => set({ body: v })} path={`${path}.body`} />
            <ImageAttachment hint="Shown above the text." value={block.image} onChange={(image) => set({ image })} path={`${path}.image`} {...library} />
          </>
        )}

        {block.type === "vocabulary" && (
          <div className="space-y-2">
            <p className="text-xs font-medium">
              Words <span className="font-normal text-ink-muted">({block.vocabIds.length} of max. 40)</span>
            </p>
            {block.vocabIds.length > 0 && (
              <ol className="space-y-1">
                {block.vocabIds.map((vid, i) => (
                  <li key={vid} className="flex items-center gap-2 rounded-md border border-line px-2 py-1">
                    <span className="w-6 text-xs tabular-nums text-ink-muted">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <LinkedItem summary={related[vid]} id={vid} kind="vocabulary" />
                    </div>
                    <RowControls
                      index={i}
                      count={block.vocabIds.length}
                      label={related[vid]?.label ?? "word"}
                      onMove={(idx, d) => set({ vocabIds: move(block.vocabIds, idx, d) })}
                      onRemove={(idx) => set({ vocabIds: removeAt(block.vocabIds, idx) })}
                    />
                  </li>
                ))}
              </ol>
            )}
            {vocabErrors.length > 0 && <p className="text-xs text-danger-700">{vocabErrors.join(" · ")}</p>}
            {block.vocabIds.length < 40 && (
              <ContentPicker
                kind="vocabulary"
                label="Add words from the vocabulary library"
                defaultLevel={levelCode}
                pickedIds={block.vocabIds}
                onPick={(o) => {
                  remember(o);
                  set({ vocabIds: [...block.vocabIds, o.id] });
                }}
              />
            )}
          </div>
        )}

        {(block.type === "grammar" || isExercise) && (
          <div className="space-y-2">
            <p className="text-xs font-medium">{block.type === "grammar" ? "Grammar topic" : "Exercise"}</p>
            {block.refId ? (
              <div className="flex items-center gap-2 rounded-md border border-line px-2 py-1">
                <div className="min-w-0 flex-1">
                  <LinkedItem summary={related[block.refId]} id={block.refId} kind={kind}>
                    {isExercise && SKILL_FOR_BLOCK[block.type] && related[block.refId]?.skill && related[block.refId].skill !== SKILL_FOR_BLOCK[block.type] && (
                      <span className="text-xs text-warning-700">skill differs from the block type</span>
                    )}
                  </LinkedItem>
                </div>
                <button type="button" onClick={() => set({ refId: "" })} className="h-7 rounded border border-line px-2 text-xs hover:bg-canvas">
                  Change
                </button>
              </div>
            ) : (
              <ContentPicker
                kind={kind}
                label={block.type === "grammar" ? "Choose a grammar topic" : "Choose an exercise"}
                defaultLevel={levelCode}
                defaultSkill={SKILL_FOR_BLOCK[block.type]}
                actionLabel="Choose"
                onPick={(o) => {
                  remember(o);
                  set({ refId: o.id });
                }}
              />
            )}
            {refErrors.length > 0 && <p className="text-xs text-danger-700">{refErrors.join(" · ")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// images: summaries of the attached images (getContentForAdmin().images)
export default function LessonEditor({ item, modules, references, related: initialRelated, defaults, images }) {
  const library = useImageLibrary(images);
  const [s, setState] = useState(() => lessonState(item, defaults));
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const [related, setRelated] = useState(initialRelated ?? {});
  const [newType, setNewType] = useState("intro");
  const remember = (o) => setRelated((r) => ({ ...r, [o.id]: o }));
  const blocks = s.blocks;
  const levelCode = modules.find((m) => m.id === s.moduleId)?.levelCode;

  const addBlock = () => {
    const key = suggestBlockKey(newType, blocks.map((b) => b.key));
    set({ blocks: [...blocks, blockState({ type: newType, key }, { persisted: false })] });
  };

  const moduleOptions = [{ value: "", label: "Choose a module…" }, ...modules.map((m) => ({ value: m.id, label: m.label }))];

  return (
    <EditorShell
      kind="lessons"
      item={item}
      buildPayload={() => lessonPayload({ ...s, slug: s.slug || slugify(s.title.de) })}
      // Saved blocks lock their keys (learner progress is stored per key).
      onSaved={() => setState((prev) => ({ ...prev, blocks: prev.blocks.map((b) => ({ ...b, persisted: true })) }))}
    >
      <Panel title="Lesson">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select className="sm:col-span-2" label="Module" value={s.moduleId} onChange={(v) => set({ moduleId: v })} options={moduleOptions} path="moduleId" />
          <TextInput label="Order" inputMode="numeric" value={s.order} onChange={(v) => set({ order: v })} path="order" />
          <TextInput label="Estimated minutes" inputMode="numeric" value={s.estimatedMinutes} onChange={(v) => set({ estimatedMinutes: v })} path="estimatedMinutes" />
        </div>
        <TextInput
          label="Slug"
          className="font-mono sm:w-80"
          value={s.slug}
          placeholder={slugify(s.title.de)}
          onChange={(v) => set({ slug: v })}
          path="slug"
          hint={item ? "Changing the slug changes the learner URL." : "Unique within the module. Empty = generated from the German title."}
        />
        <LocalizedInput label="Title" required={["de"]} value={s.title} onChange={(v) => set({ title: v })} path="title" />
        <LocalizedInput label="Description" multiline rows={2} value={s.description} onChange={(v) => set({ description: v })} path="description" />
      </Panel>

      <section aria-labelledby="blocks-heading" className="space-y-3">
        <div>
          <h2 id="blocks-heading" className="text-sm font-semibold">
            Lesson blocks <span className="font-normal text-ink-muted">({blocks.length} of max. 30)</span>
          </h2>
          <p className="text-xs text-ink-muted">
            Learners go through the blocks in this order. A lesson can only be published when every word, grammar topic and exercise it uses is published.
          </p>
        </div>
        {blocks.length === 0 && <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-muted">No blocks yet. Add the first one below.</p>}
        {blocks.map((b, i) => (
          <BlockEditor
            key={b.uid}
            block={b}
            index={i}
            count={blocks.length}
            related={related}
            remember={remember}
            levelCode={levelCode}
            library={library}
            onChange={(v) => set({ blocks: replaceAt(blocks, i, v) })}
            onMove={(idx, d) => set({ blocks: move(blocks, idx, d) })}
            onRemove={(idx) => set({ blocks: removeAt(blocks, idx) })}
          />
        ))}
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-line bg-surface p-3">
          <Select label="New block type" value={newType} onChange={setNewType} options={LESSON_BLOCK_TYPES.map((t) => ({ value: t, label: BLOCK_LABELS[t] }))} />
          <AddButton onClick={addBlock} disabled={blocks.length >= 30}>
            + Add block
          </AddButton>
        </div>
      </section>

      <MasteryEditor scope="lesson" value={s.mastery} onChange={(v) => set({ mastery: v })} />
      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}
