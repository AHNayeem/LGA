"use client";

import { useState } from "react";
import EditorShell from "@/components/admin/editor/EditorShell";
import ImageAttachment, { useImageLibrary } from "@/components/admin/editor/ImageAttachment";
import { AddButton, LocalizedInput, Panel, RowControls, Select, TextInput, move, removeAt, replaceAt } from "@/components/admin/editor/fields";
import { MasteryEditor, ProvenanceFields, TagsAndRefs } from "@/components/admin/editor/groups";
import {
  grammarPayload,
  grammarState,
  levelPayload,
  levelState,
  locState,
  modulePayload,
  moduleState,
  sectionState,
  slugify,
  uid,
  vocabularyPayload,
  vocabularyState,
} from "@/components/admin/editor/payload";
import { ARTICLES, LEVEL_CODES, PARTS_OF_SPEECH } from "@/lib/content/constants";

// Editors for levels, modules, vocabulary and grammar topics. Lessons and exercises have
// their own files (block composer, item builder).

function useEditorState(init) {
  const [state, setState] = useState(init);
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));
  return [state, set];
}

export const levelOptions = (levels) => {
  const known = new Set(levels.map((l) => l.code));
  return LEVEL_CODES.map((code) => ({ value: code, label: known.has(code) ? levels.find((l) => l.code === code).label : `${code} (no level record yet)` }));
};

// Slugs are suggested from the title/lemma until the author edits them (new items only).
function SlugInput({ state, set, isNew, source, hint = "Lowercase letters, numbers and hyphens. Unique per level." }) {
  const [touched, setTouched] = useState(!isNew);
  const suggested = slugify(source);
  const value = touched ? state.slug : state.slug || suggested;
  return (
    <TextInput
      label="Slug"
      value={value}
      onChange={(v) => {
        setTouched(true);
        set({ slug: v });
      }}
      path="slug"
      hint={isNew ? hint : "Changing the slug changes the learner URL."}
      className="font-mono"
    />
  );
}

// The slug shown while untouched is the suggestion; make sure it is what gets saved.
const withSlug = (state, source) => ({ ...state, slug: state.slug || slugify(source) });

export function LevelEditor({ item, references }) {
  const [s, set] = useEditorState(() => levelState(item));
  return (
    <EditorShell kind="levels" item={item} buildPayload={() => levelPayload(s)}>
      <Panel title="Level">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Code"
            value={s.code}
            onChange={(v) => set({ code: v })}
            options={[{ value: "", label: "Choose…" }, ...LEVEL_CODES.map((c) => ({ value: c, label: c }))]}
            path="code"
            disabled={Boolean(item)}
            hint={item ? "Modules refer to the level by its code, so it can't change." : undefined}
          />
          <TextInput label="Order" inputMode="numeric" value={s.order} onChange={(v) => set({ order: v })} path="order" />
        </div>
        <LocalizedInput label="Title" required={["de"]} value={s.title} onChange={(v) => set({ title: v })} path="title" />
        <LocalizedInput label="Description" multiline value={s.description} onChange={(v) => set({ description: v })} path="description" />
      </Panel>
      <MasteryEditor scope="level" value={s.mastery} onChange={(v) => set({ mastery: v })} />
      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}

export function ModuleEditor({ item, levels, references, defaults }) {
  const [s, set] = useEditorState(() => moduleState(item, defaults));
  const goals = s.goals;
  return (
    <EditorShell kind="modules" item={item} buildPayload={() => modulePayload(withSlug(s, s.title.de))}>
      <Panel title="Module">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Level" value={s.levelCode} onChange={(v) => set({ levelCode: v })} options={levelOptions(levels)} path="levelCode" />
          <SlugInput state={s} set={set} isNew={!item} source={s.title.de} />
          <TextInput label="Order" inputMode="numeric" value={s.order} onChange={(v) => set({ order: v })} path="order" />
        </div>
        <LocalizedInput label="Title" required={["de"]} value={s.title} onChange={(v) => set({ title: v })} path="title" />
        <LocalizedInput label="Description" multiline value={s.description} onChange={(v) => set({ description: v })} path="description" />
      </Panel>
      <Panel title="Learning goals" description="What the learner can do after the module (shown on the module page).">
        {goals.map((g, i) => (
          <div key={g.uid} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <LocalizedInput
                label={`Goal ${i + 1}`}
                value={g.text}
                onChange={(v) => set({ goals: replaceAt(goals, i, { ...g, text: v }) })}
                path={`goals.${i}`}
              />
            </div>
            <RowControls index={i} count={goals.length} label={`goal ${i + 1}`} onMove={(idx, d) => set({ goals: move(goals, idx, d) })} onRemove={(idx) => set({ goals: removeAt(goals, idx) })} />
          </div>
        ))}
        <AddButton onClick={() => set({ goals: [...goals, { uid: uid(), text: locState() }] })} disabled={goals.length >= 20}>
          + Add goal
        </AddButton>
      </Panel>
      <MasteryEditor scope="module" value={s.mastery} onChange={(v) => set({ mastery: v })} />
      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}

const POS_LABELS = { proper_noun: "proper noun", question_word: "question word" };

// images: summaries of the attached image (getContentForAdmin().images)
export function VocabularyEditor({ item, levels, references, defaults, images }) {
  const [s, set] = useEditorState(() => vocabularyState(item, defaults));
  const library = useImageLibrary(images);
  const isNoun = s.pos === "noun";
  return (
    <EditorShell kind="vocabulary" item={item} buildPayload={() => vocabularyPayload(withSlug(s, s.lemma))}>
      <Panel title="Word">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select label="Level" value={s.levelCode} onChange={(v) => set({ levelCode: v })} options={levelOptions(levels)} path="levelCode" />
          <Select
            label="Part of speech"
            value={s.pos}
            onChange={(v) => set({ pos: v })}
            options={PARTS_OF_SPEECH.map((p) => ({ value: p, label: POS_LABELS[p] ?? p }))}
            path="pos"
          />
          <Select
            label={isNoun ? "Article *" : "Article"}
            value={s.article}
            onChange={(v) => set({ article: v })}
            options={[{ value: "", label: "none" }, ...ARTICLES.map((a) => ({ value: a, label: a }))]}
            path="article"
            hint={isNoun ? "Nouns are always learned with their article." : undefined}
          />
          <SlugInput state={s} set={set} isNew={!item} source={s.lemma} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Lemma *" lang="de" value={s.lemma} onChange={(v) => set({ lemma: v })} path="lemma" hint="Without the article, e.g. “Sprache”." />
          <TextInput label="Plural" lang="de" value={s.plural} onChange={(v) => set({ plural: v })} path="plural" hint="With article, e.g. “die Sprachen”. Leave empty if not applicable." />
        </div>
        <LocalizedInput label="Meanings" required={["en"]} value={s.meanings} onChange={(v) => set({ meanings: v })} path="meanings" />
        <LocalizedInput label="Example sentence" value={s.example} onChange={(v) => set({ example: v })} path="example" hint="German (de) is required when an example is given." />
        <LocalizedInput label="Notes" multiline rows={2} value={s.notes} onChange={(v) => set({ notes: v })} path="notes" />
        <TextInput label="Topics" hint="Lowercase slugs, separated by commas (e.g. begruessung, laender)" value={s.topics} onChange={(v) => set({ topics: v })} path="topics" />
        <ImageAttachment
          label="Picture of the word (optional)"
          hint="Shown on the flashcard together with the meaning."
          value={s.image}
          onChange={(image) => set({ image })}
          path="image"
          {...library}
        />
      </Panel>
      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}

function TableEditor({ table, onChange }) {
  const { headers, rows } = table;
  const cell = "w-full min-w-24 rounded border border-line bg-surface px-2 py-1 text-sm";
  const setHeader = (c, v) => onChange({ headers: replaceAt(headers, c, v), rows });
  const setCell = (r, c, v) => onChange({ headers, rows: replaceAt(rows, r, replaceAt(rows[r], c, v)) });
  const addColumn = () => onChange({ headers: [...headers, ""], rows: rows.map((r) => [...r, ""]) });
  const removeColumn = (c) => onChange({ headers: removeAt(headers, c), rows: rows.map((r) => removeAt(r, c)) });
  const addRow = () => onChange({ headers, rows: [...rows, headers.map(() => "")] });
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              {headers.map((h, c) => (
                <th key={c} scope="col" className="p-1 align-bottom">
                  <input aria-label={`Column ${c + 1} header`} lang="de" className={`${cell} font-semibold`} value={h} onChange={(e) => setHeader(c, e.target.value)} />
                  {headers.length > 1 && (
                    <button type="button" className="mt-0.5 text-xs text-danger-700" onClick={() => removeColumn(c)}>
                      Remove column
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td key={c} className="p-1">
                    <input aria-label={`Row ${r + 1}, column ${c + 1}`} lang="de" className={cell} value={v} onChange={(e) => setCell(r, c, e.target.value)} />
                  </td>
                ))}
                <td className="p-1">
                  {rows.length > 1 && (
                    <RowControls
                      index={r}
                      count={rows.length}
                      label={`row ${r + 1}`}
                      onMove={(i, d) => onChange({ headers, rows: move(rows, i, d) })}
                      onRemove={(i) => onChange({ headers, rows: removeAt(rows, i) })}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <AddButton onClick={addRow} disabled={rows.length >= 20}>+ Row</AddButton>
        <AddButton onClick={addColumn} disabled={headers.length >= 8}>+ Column</AddButton>
      </div>
    </div>
  );
}

export function GrammarEditor({ item, levels, references, defaults }) {
  const [s, set] = useEditorState(() => grammarState(item, defaults));
  const sections = s.sections;
  const setSection = (i, patch) => set({ sections: replaceAt(sections, i, { ...sections[i], ...patch }) });
  return (
    <EditorShell kind="grammarTopics" item={item} buildPayload={() => grammarPayload(withSlug(s, s.title.de))}>
      <Panel title="Grammar topic">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Level" value={s.levelCode} onChange={(v) => set({ levelCode: v })} options={levelOptions(levels)} path="levelCode" />
          <SlugInput state={s} set={set} isNew={!item} source={s.title.de} />
        </div>
        <LocalizedInput label="Title" required={["de"]} value={s.title} onChange={(v) => set({ title: v })} path="title" />
        <LocalizedInput label="Summary" multiline rows={2} value={s.summary} onChange={(v) => set({ summary: v })} path="summary" />
      </Panel>

      {sections.map((sec, i) => (
        <Panel
          key={sec.uid}
          title={`Section ${i + 1}`}
          actions={
            <RowControls
              index={i}
              count={sections.length}
              label={`section ${i + 1}`}
              onMove={(idx, d) => set({ sections: move(sections, idx, d) })}
              onRemove={(idx) => set({ sections: removeAt(sections, idx) })}
            />
          }
        >
          <LocalizedInput label="Heading" value={sec.heading} onChange={(v) => setSection(i, { heading: v })} path={`sections.${i}.heading`} />
          <LocalizedInput label="Explanation" multiline rows={4} value={sec.body} onChange={(v) => setSection(i, { body: v })} path={`sections.${i}.body`} />
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={sec.hasTable} onChange={(e) => setSection(i, { hasTable: e.target.checked })} />
              Table (e.g. a conjugation table)
            </label>
            {sec.hasTable && (
              <div className="mt-2">
                <TableEditor table={sec.table} onChange={(t) => setSection(i, { table: t })} />
              </div>
            )}
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">Examples</legend>
            {sec.examples.map((ex, j) => (
              <div key={ex.uid} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <LocalizedInput
                    label={`Example ${j + 1}`}
                    required={["de"]}
                    value={ex.text}
                    onChange={(v) => setSection(i, { examples: replaceAt(sec.examples, j, { ...ex, text: v }) })}
                    path={`sections.${i}.examples.${j}`}
                  />
                </div>
                <RowControls
                  index={j}
                  count={sec.examples.length}
                  label={`example ${j + 1}`}
                  onMove={(idx, d) => setSection(i, { examples: move(sec.examples, idx, d) })}
                  onRemove={(idx) => setSection(i, { examples: removeAt(sec.examples, idx) })}
                />
              </div>
            ))}
            <AddButton
              onClick={() => setSection(i, { examples: [...sec.examples, { uid: uid(), text: locState() }] })}
              disabled={sec.examples.length >= 12}
            >
              + Add example
            </AddButton>
          </fieldset>
        </Panel>
      ))}
      <AddButton onClick={() => set({ sections: [...sections, sectionState()] })} disabled={sections.length >= 12}>
        + Add section
      </AddButton>

      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}
