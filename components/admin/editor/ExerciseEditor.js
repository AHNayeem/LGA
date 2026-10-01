"use client";

import { useId, useState } from "react";
import EditorShell from "@/components/admin/editor/EditorShell";
import AudioAttachment from "@/components/admin/editor/AudioAttachment";
import ImageAttachment, { useImageLibrary } from "@/components/admin/editor/ImageAttachment";
import { AddButton, Checkbox, LocalizedInput, Panel, RowControls, Select, TextInput, move, removeAt, replaceAt, useFieldErrors } from "@/components/admin/editor/fields";
import { ProvenanceFields, TagsAndRefs } from "@/components/admin/editor/groups";
import { levelOptions } from "@/components/admin/editor/simpleEditors";
import { cueState, exercisePayload, exerciseState, itemState, locState, nextId, nextOptionId, slugify, uid } from "@/components/admin/editor/payload";
import { ITEM_TYPE_LABELS, SPEECH_RATES, STIMULUS_TEXT_KINDS, TRANSCRIPT_POLICIES, VOICE_ROLES } from "@/lib/content/constants";
import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";

// Exercise builder around the existing `exercises` schema: level, skill, instructions,
// stimulus (reading text and/or listening lines), items with their answer keys, and the
// pass threshold. Audio is a *cue* (text, voice, speed) whose TTS clip is generated
// offline (`bun run audio:generate`); a listening passage or item may also attach a
// recording from the media library, which then plays instead. Publishing checks that
// every listening target has one of the two.

const MAX_ITEMS = 30;
const voiceOptions = VOICE_ROLES.map((v) => ({ value: v, label: v }));
const rateOptions = SPEECH_RATES.map((v) => ({ value: v, label: v }));

function AudioCueFields({ cue, onChange, path, label = "Audio text (German)" }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_8rem_8rem]">
      <TextInput label={label} lang="de" value={cue.text} onChange={(v) => onChange({ ...cue, text: v })} path={`${path}.text`} />
      <Select label="Voice" value={cue.voice} onChange={(v) => onChange({ ...cue, voice: v })} options={voiceOptions} path={`${path}.voice`} />
      <Select label="Speed" value={cue.rate} onChange={(v) => onChange({ ...cue, rate: v })} options={rateOptions} path={`${path}.rate`} />
    </div>
  );
}

function StimulusEditor({ value, onChange, audio, library }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const lines = value.lines;
  return (
    <>
      <LocalizedInput label="Reading text" multiline rows={5} value={value.text} onChange={(v) => set({ text: v })} path="stimulus.text" />
      <ImageAttachment
        hint="Shown above the text and audio, e.g. a sign, a form or a situation."
        value={value.image}
        onChange={(image) => set({ image })}
        path="stimulus.image"
        {...library}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Text kind"
          value={value.textKind}
          onChange={(v) => set({ textKind: v })}
          options={[{ value: "", label: "—" }, ...STIMULUS_TEXT_KINDS.map((k) => ({ value: k, label: k }))]}
          path="stimulus.textKind"
        />
        <Select
          label="Transcript"
          value={value.transcriptPolicy}
          onChange={(v) => set({ transcriptPolicy: v })}
          options={TRANSCRIPT_POLICIES.map((p) => ({ value: p, label: p.replace("_", " ") }))}
          path="stimulus.transcriptPolicy"
        />
        <TextInput label="Max plays" inputMode="numeric" hint="Empty = unlimited" value={value.maxPlays} onChange={(v) => set({ maxPlays: v })} path="stimulus.maxPlays" />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium">Listening lines (dialogue / announcement)</legend>
        {lines.map((l, i) => (
          <div key={l.uid} className="flex items-end gap-2 rounded-lg border border-line p-2">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[9rem_1fr]">
              <TextInput label="Speaker" value={l.speaker} onChange={(v) => set({ lines: replaceAt(lines, i, { ...l, speaker: v }) })} path={`stimulus.audio.lines.${i}.speaker`} />
              <AudioCueFields cue={l} label={`Line ${i + 1}`} onChange={(c) => set({ lines: replaceAt(lines, i, { ...l, ...c }) })} path={`stimulus.audio.lines.${i}`} />
            </div>
            <RowControls index={i} count={lines.length} label={`line ${i + 1}`} onMove={(idx, d) => set({ lines: move(lines, idx, d) })} onRemove={(idx) => set({ lines: removeAt(lines, idx) })} />
          </div>
        ))}
        <AddButton onClick={() => set({ lines: [...lines, { uid: uid(), speaker: "", ...cueState() }] })} disabled={lines.length >= 30}>
          + Add line
        </AddButton>
      </fieldset>
      {lines.length > 0 && (
        <AudioAttachment
          label="Passage audio"
          path="stimulus.audio.mediaId"
          mediaId={value.mediaId}
          onChange={(mediaId) => set({ mediaId })}
          status={audio.status("stimulus")}
          media={audio.media}
          onKnown={audio.onKnown}
        />
      )}
    </>
  );
}

function McqFields({ item, set, path }) {
  const name = useId();
  const options = item.options;
  const answerErrors = useFieldErrors(`${path}.answer`);
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium">Options (select the correct one)</legend>
      {options.map((o, i) => (
        <div key={o.uid} className="flex items-start gap-2 rounded-lg border border-line p-2">
          <label className="mt-6 flex items-center gap-1 text-xs">
            <input type="radio" name={name} className="h-4 w-4 accent-brand-600" checked={item.answer === o.id && o.id !== ""} onChange={() => set({ answer: o.id })} />
            Correct
          </label>
          <TextInput
            className="w-16"
            label="Id"
            value={o.id}
            onChange={(v) => set({ options: replaceAt(options, i, { ...o, id: v }), ...(item.answer === o.id ? { answer: v } : {}) })}
            path={`${path}.options.${i}.id`}
          />
          <div className="min-w-0 flex-1">
            <LocalizedInput label={`Option ${o.id}`} value={o.text} onChange={(v) => set({ options: replaceAt(options, i, { ...o, text: v }) })} path={`${path}.options.${i}.text`} />
          </div>
          <RowControls
            index={i}
            count={options.length}
            label={`option ${o.id}`}
            onMove={(idx, d) => set({ options: move(options, idx, d) })}
            onRemove={(idx) => set({ options: removeAt(options, idx) })}
          />
        </div>
      ))}
      {answerErrors.length > 0 && <p className="text-xs text-danger-700">{answerErrors.join(" · ")}</p>}
      <AddButton
        onClick={() => set({ options: [...options, { uid: uid(), id: nextOptionId(options.map((o) => o.id)), text: locState() }] })}
        disabled={options.length >= 6}
      >
        + Add option
      </AddButton>
    </fieldset>
  );
}

function TrueFalseFields({ item, set, path }) {
  const name = useId();
  return (
    <>
      <LocalizedInput label="Statement" required={["de"]} value={item.statement} onChange={(v) => set({ statement: v })} path={`${path}.statement`} />
      <fieldset className="flex gap-4 text-sm">
        <legend className="mb-1 text-xs font-medium">Correct answer</legend>
        <label className="flex items-center gap-1.5">
          <input type="radio" name={name} className="h-4 w-4 accent-brand-600" checked={item.truth === true} onChange={() => set({ truth: true })} />
          <span lang="de">richtig</span>
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name={name} className="h-4 w-4 accent-brand-600" checked={item.truth === false} onChange={() => set({ truth: false })} />
          <span lang="de">falsch</span>
        </label>
      </fieldset>
    </>
  );
}

function TextInputFields({ item, set, path }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        <TextInput label="Field label" lang="de" hint="Form filling, e.g. “Vorname”" value={item.label} onChange={(v) => set({ label: v })} path={`${path}.label`} />
        <TextInput label="Text before the gap" lang="de" value={item.before} onChange={(v) => set({ before: v })} path={`${path}.before`} />
        <TextInput label="Text after the gap" lang="de" value={item.after} onChange={(v) => set({ after: v })} path={`${path}.after`} />
      </div>
      <TextInput
        label="Accepted answers"
        multiline
        rows={3}
        lang="de"
        hint="One per line. The first is shown as the expected answer."
        value={item.accepted}
        onChange={(v) => set({ accepted: v })}
        path={`${path}.accepted`}
      />
      <div className="grid gap-2 sm:grid-cols-4">
        <Checkbox label="Case sensitive" checked={item.caseSensitive} onChange={(v) => set({ caseSensitive: v })} />
        <Checkbox label="Accept ae/oe/ue/ss" checked={item.umlautTolerant} onChange={(v) => set({ umlautTolerant: v })} />
        <Checkbox label="Ignore spaces" hint="Phone numbers" checked={item.ignoreSpaces} onChange={(v) => set({ ignoreSpaces: v })} />
        <Select
          label="Keyboard"
          value={item.inputMode}
          onChange={(v) => set({ inputMode: v })}
          options={["text", "numeric", "email"].map((m) => ({ value: m, label: m }))}
          path={`${path}.inputMode`}
        />
      </div>
    </>
  );
}

function MatchFields({ item, set, path }) {
  const pairs = item.pairs;
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium">Pairs (the right side is shuffled for learners)</legend>
      {pairs.map((p, i) => (
        <div key={p.uid} className="flex items-start gap-2 rounded-lg border border-line p-2">
          <TextInput className="w-16" label="Id" value={p.id} onChange={(v) => set({ pairs: replaceAt(pairs, i, { ...p, id: v }) })} path={`${path}.pairs.${i}.id`} />
          <div className="grid min-w-0 flex-1 gap-2">
            <LocalizedInput label="Left" value={p.left} onChange={(v) => set({ pairs: replaceAt(pairs, i, { ...p, left: v }) })} path={`${path}.pairs.${i}.left`} />
            <LocalizedInput label="Right" value={p.right} onChange={(v) => set({ pairs: replaceAt(pairs, i, { ...p, right: v }) })} path={`${path}.pairs.${i}.right`} />
          </div>
          <RowControls index={i} count={pairs.length} label={`pair ${i + 1}`} onMove={(idx, d) => set({ pairs: move(pairs, idx, d) })} onRemove={(idx) => set({ pairs: removeAt(pairs, idx) })} />
        </div>
      ))}
      <AddButton
        onClick={() => set({ pairs: [...pairs, { uid: uid(), id: nextId("p", pairs.map((p) => p.id)), left: locState(), right: locState() }] })}
        disabled={pairs.length >= 8}
      >
        + Add pair
      </AddButton>
    </fieldset>
  );
}

function OrderFields({ item, set, path }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <TextInput
        label="Tokens in a correct order"
        multiline
        rows={4}
        lang="de"
        hint="One word or punctuation mark per line. Learners get them shuffled."
        value={item.tokens}
        onChange={(v) => set({ tokens: v })}
        path={`${path}.tokens`}
      />
      <TextInput
        label="Other correct sentences"
        multiline
        rows={4}
        lang="de"
        hint="One full sentence per line, e.g. “Aus Polen komme ich.”"
        value={item.alternatives}
        onChange={(v) => set({ alternatives: v })}
        path={`${path}.alternatives`}
      />
    </div>
  );
}

function SpeakFields({ item, set, path }) {
  return (
    <>
      <LocalizedInput label="Cue card" hint="Keywords shown to the learner, e.g. “Name? – Land? – Wohnort?”" value={item.cue} onChange={(v) => set({ cue: v })} path={`${path}.cue`} />
      <LocalizedInput label="Model answer" required={["de"]} multiline rows={2} value={item.modelAnswer} onChange={(v) => set({ modelAnswer: v })} path={`${path}.modelAnswer`} />
      <Checkbox label="Model answer audio" checked={item.hasModelAudio} onChange={(v) => set({ hasModelAudio: v })} />
      {item.hasModelAudio && <AudioCueFields cue={item.modelAudio} onChange={(c) => set({ modelAudio: c })} path={`${path}.modelAudio`} />}
      <p className="text-xs text-ink-muted">Speaking prompts are ungraded practice: learners rate themselves, and there is no pronunciation scoring.</p>
    </>
  );
}

const TYPE_FIELDS = { mcq: McqFields, true_false: TrueFalseFields, text_input: TextInputFields, match: MatchFields, order: OrderFields, speak_prompt: SpeakFields };

function ItemEditor({ item, index, count, onChange, onMove, onRemove, audio }) {
  const path = `items.${index}`;
  const set = (patch) => onChange({ ...item, ...patch });
  const Fields = TYPE_FIELDS[item.type];
  const itemErrors = useFieldErrors(path);
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-xs" data-testid="exercise-item">
      <div className="flex flex-wrap items-end gap-2">
        <h3 className="mr-auto text-sm font-semibold">
          Item {index + 1} <span className="font-mono text-xs font-normal text-ink-muted">{item.id}</span>
        </h3>
        <RowControls index={index} count={count} label={`item ${index + 1}`} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
          <Select
            label="Question type"
            value={item.type}
            onChange={(v) => set({ type: v })}
            options={Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            path={`${path}.type`}
          />
          <TextInput label="Item id" value={item.id} onChange={(v) => set({ id: v })} path={`${path}.id`} className="font-mono" />
        </div>
        {itemErrors.length > 0 && <p className="text-xs text-danger-700">{itemErrors.join(" · ")}</p>}
        <LocalizedInput label="Prompt / question" value={item.prompt} onChange={(v) => set({ prompt: v })} path={`${path}.prompt`} />
        <Fields item={item} set={set} path={path} />
        <details className="rounded-lg bg-canvas p-2 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-brand-700">Item audio and explanation</summary>
          <div className="mt-2 space-y-3">
            <Checkbox label="Audio for this item (listening)" hint="Required before publishing: the clip must be generated." checked={item.hasAudio} onChange={(v) => set({ hasAudio: v })} />
            {item.hasAudio && (
              <>
                <AudioCueFields cue={item.audio} onChange={(c) => set({ audio: { ...item.audio, ...c } })} path={`${path}.audio`} />
                <AudioAttachment
                  label="Item audio"
                  path={`${path}.audio.mediaId`}
                  mediaId={item.audio.mediaId}
                  onChange={(mediaId) => set({ audio: { ...item.audio, mediaId } })}
                  status={audio.status(item.id)}
                  media={audio.media}
                  onKnown={audio.onKnown}
                />
              </>
            )}
            <LocalizedInput label="Explanation (shown after submitting)" multiline rows={2} value={item.explanation} onChange={(v) => set({ explanation: v })} path={`${path}.explanation`} />
          </div>
        </details>
      </div>
    </div>
  );
}

// audioStatus: the saved version's audio per listening target (contentService checks).
// images: summaries of the attached stimulus image (getContentForAdmin().images)
export default function ExerciseEditor({ item, levels, references, defaults, audioStatus = null, images }) {
  const library = useImageLibrary(images);
  const [s, setState] = useState(() => exerciseState(item, defaults));
  const [media, setMedia] = useState(() =>
    Object.fromEntries((audioStatus?.targets ?? []).filter((t) => t.native).map((t) => [t.native.id, t.native])),
  );
  const audio = {
    status: (target) => audioStatus?.targets.find((t) => t.target === target) ?? null,
    media,
    onKnown: (m) => setMedia((prev) => ({ ...prev, [m.id]: m })),
  };
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const items = s.items;
  const addItem = () => set({ items: [...items, itemState({ type: items.at(-1)?.type ?? "mcq", id: nextId("q", items.map((i) => i.id)) })] });
  const payload = () => exercisePayload({ ...s, slug: s.slug || slugify(s.title.de) });

  return (
    <EditorShell kind="exercises" item={item} buildPayload={payload}>
      <Panel title="Exercise">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select label="Level" value={s.levelCode} onChange={(v) => set({ levelCode: v })} options={levelOptions(levels)} path="levelCode" />
          <Select label="Skill" value={s.skill} onChange={(v) => set({ skill: v })} options={SKILLS.map((k) => ({ value: k, label: SKILL_LABELS[k].en }))} path="skill" />
          <TextInput label="Slug" className="font-mono" value={s.slug} placeholder={slugify(s.title.de)} onChange={(v) => set({ slug: v })} path="slug" hint="Unique per level." />
          <TextInput label="Pass threshold %" inputMode="decimal" value={s.passThreshold} onChange={(v) => set({ passThreshold: v })} path="passThreshold" hint="Share of points needed to complete the step." />
        </div>
        <LocalizedInput label="Title" required={["de"]} value={s.title} onChange={(v) => set({ title: v })} path="title" />
        <LocalizedInput label="Instructions" multiline rows={2} value={s.instructions} onChange={(v) => set({ instructions: v })} path="instructions" />
        <TextInput
          label="Max plays per item audio"
          inputMode="numeric"
          className="sm:w-60"
          hint="Empty = unlimited (Goethe Hören: 2)"
          value={s.itemAudioMaxPlays}
          onChange={(v) => set({ itemAudioMaxPlays: v })}
          path="itemAudioMaxPlays"
        />
      </Panel>

      <Panel title="Stimulus" description="A reading text and/or listening lines shown above the questions. Listening exercises need audio here or on their items.">
        <Checkbox label="This exercise has a stimulus" checked={s.hasStimulus} onChange={(v) => set({ hasStimulus: v })} />
        {s.hasStimulus && <StimulusEditor value={s.stimulus} onChange={(v) => set({ stimulus: v })} audio={audio} library={library} />}
      </Panel>

      <section aria-labelledby="items-heading" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="items-heading" className="text-sm font-semibold">
            Questions <span className="font-normal text-ink-muted">({items.length} of max. {MAX_ITEMS})</span>
          </h2>
        </div>
        {items.map((it, i) => (
          <ItemEditor
            key={it.uid}
            item={it}
            index={i}
            count={items.length}
            onChange={(v) => set({ items: replaceAt(items, i, v) })}
            onMove={(idx, d) => set({ items: move(items, idx, d) })}
            onRemove={(idx) => set({ items: removeAt(items, idx) })}
            audio={audio}
          />
        ))}
        <AddButton onClick={addItem} disabled={items.length >= MAX_ITEMS}>
          + Add question
        </AddButton>
      </section>

      <TagsAndRefs state={s} set={set} references={references} />
      <ProvenanceFields state={s} set={set} />
    </EditorShell>
  );
}
