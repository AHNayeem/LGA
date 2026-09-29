import { EXPLANATION_LOCALES, LEARNING_LANGUAGE } from "@/lib/i18n/locales";
import { SKILLS } from "@/lib/content/skills";

// Pure conversions between stored content documents and the admin editors' form state.
//   *State(doc)    document (or nothing, for "new") → editable state (strings, flags)
//   *Payload(state) state → the plain object the content schemas validate on the server
// No validation happens here: the server's Zod schemas are the single source of truth and
// their field errors are shown next to the inputs. Payload builders only drop empty
// optional values, so an untouched optional field is never sent as "".

export const LOCALES = Object.freeze([LEARNING_LANGUAGE, ...EXPLANATION_LOCALES]);

let uidCounter = 0;
// React list keys for rows (never rendered into the DOM).
export const uid = () => `r${++uidCounter}`;

// --- Primitives -----------------------------------------------------------------------

export const locState = (v) => Object.fromEntries(LOCALES.map((k) => [k, v?.[k] ?? ""]));

export function locOptional(v) {
  const out = {};
  for (const k of LOCALES) if (typeof v?.[k] === "string" && v[k].trim()) out[k] = v[k];
  return Object.keys(out).length ? out : undefined;
}

// Required localised fields are always sent, so the server reports which language is missing.
export const locRequired = (v) => locOptional(v) ?? {};

const str = (v) => (v == null || String(v).trim() === "" ? undefined : String(v));
const num = (v) => (v === "" || v == null ? undefined : Number(v));
export const lines = (v) =>
  String(v ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
const slugList = (v) =>
  String(v ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// Next free id of the form `${prefix}${n}` (items q1, q2 …; pairs p1 …).
export function nextId(prefix, taken) {
  const used = new Set(taken);
  for (let n = 1; ; n++) if (!used.has(`${prefix}${n}`)) return `${prefix}${n}`;
}

// Next free option letter (a, b, c …), falling back to numbered ids.
export function nextOptionId(taken) {
  const used = new Set(taken);
  for (const c of "abcdefghij") if (!used.has(c)) return c;
  return nextId("o", taken);
}

// --- Shared field groups ----------------------------------------------------------------

export function commonState(doc) {
  return {
    tags: (doc?.tags ?? []).join(", "),
    refs: (doc?.refs ?? []).map((r) => ({ uid: uid(), referenceId: r.referenceId ?? "", note: r.note ?? "" })),
    sourceType: doc?.sourceType ?? "original",
    sourceReference: doc?.sourceReference ?? "",
  };
}

export function commonPayload(s) {
  return {
    tags: slugList(s.tags),
    refs: s.refs.filter((r) => r.referenceId).map((r) => ({ referenceId: r.referenceId, ...(str(r.note) ? { note: r.note } : {}) })),
    sourceType: s.sourceType,
    ...(str(s.sourceReference) ? { sourceReference: s.sourceReference } : {}),
  };
}

// Mastery: per skill "inherit" (absent), "set" (a rule) or "remove" (null = drop an
// inherited rule). Thresholds are edited as whole percentages.
export function masteryState(mastery) {
  return Object.fromEntries(
    SKILLS.map((skill) => {
      const rule = mastery?.skills?.[skill];
      if (rule === null) return [skill, { mode: "remove", threshold: "", required: true }];
      if (rule) return [skill, { mode: "set", threshold: String(Math.round(rule.threshold * 1000) / 10), required: rule.required !== false }];
      return [skill, { mode: "inherit", threshold: "", required: true }];
    }),
  );
}

export function masteryPayload(state) {
  const skills = {};
  for (const [skill, r] of Object.entries(state)) {
    if (r.mode === "remove") skills[skill] = null;
    if (r.mode === "set") skills[skill] = { threshold: r.threshold === "" ? undefined : Number(r.threshold) / 100, required: r.required };
  }
  return Object.keys(skills).length ? { skills } : undefined;
}

const baseState = (doc) => ({
  order: String(doc?.order ?? 0),
  title: locState(doc?.title),
  description: locState(doc?.description),
  ...commonState(doc),
});

const basePayload = (s) => ({
  order: num(s.order),
  title: locRequired(s.title),
  ...(locOptional(s.description) ? { description: locOptional(s.description) } : {}),
  ...commonPayload(s),
});

const withOptional = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// An attached image from the media library (intro blocks, words, exercise stimuli):
// its id plus alt text and caption for this place. No id = no image.
export const imageState = (img) => ({ mediaId: img?.mediaId ?? "", alt: locState(img?.alt), caption: locState(img?.caption) });

export const imagePayload = (s) =>
  str(s?.mediaId) ? withOptional({ mediaId: s.mediaId, alt: locRequired(s.alt), caption: locOptional(s.caption) }) : undefined;

// --- Levels and modules -------------------------------------------------------------------

export const levelState = (doc) => ({ code: doc?.code ?? "", ...baseState(doc), mastery: masteryState(doc?.mastery) });

export const levelPayload = (s) => withOptional({ code: str(s.code), ...basePayload(s), mastery: masteryPayload(s.mastery) });

export const moduleState = (doc, defaults = {}) => ({
  levelCode: doc?.levelCode ?? defaults.levelCode ?? "A1",
  slug: doc?.slug ?? "",
  ...baseState(doc),
  goals: (doc?.goals ?? []).map((g) => ({ uid: uid(), text: locState(g) })),
  mastery: masteryState(doc?.mastery),
});

export const modulePayload = (s) =>
  withOptional({
    levelCode: s.levelCode,
    slug: str(s.slug),
    ...basePayload(s),
    goals: s.goals.map((g) => locOptional(g.text)).filter(Boolean),
    mastery: masteryPayload(s.mastery),
  });

// --- Lessons and blocks ------------------------------------------------------------------

export function blockState(b = {}, { persisted = true } = {}) {
  return {
    uid: uid(),
    persisted, // keys of saved blocks are locked: learner progress is stored per key
    type: b.type ?? "intro",
    key: b.key ?? "",
    title: locState(b.title),
    body: locState(b.body),
    image: imageState(b.image),
    vocabIds: [...(b.vocabIds ?? [])],
    refId: b.refId ?? "",
  };
}

export function blockPayload(b) {
  const base = withOptional({ type: b.type, key: str(b.key), title: locOptional(b.title) });
  if (b.type === "intro") return withOptional({ ...base, body: locRequired(b.body), image: imagePayload(b.image) });
  if (b.type === "vocabulary") return { ...base, vocabIds: b.vocabIds };
  return withOptional({ ...base, refId: str(b.refId) });
}

// Suggested key for a new block: its type, numbered if already used ("practice-2").
export function suggestBlockKey(type, taken) {
  const base = type.replace(/_/g, "-");
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n++) if (!taken.includes(`${base}-${n}`)) return `${base}-${n}`;
}

export const lessonState = (doc, defaults = {}) => ({
  moduleId: doc?.moduleId ?? defaults.moduleId ?? "",
  slug: doc?.slug ?? "",
  ...baseState(doc),
  estimatedMinutes: doc?.estimatedMinutes != null ? String(doc.estimatedMinutes) : "",
  blocks: (doc?.blocks ?? []).map((b) => blockState(b)),
  mastery: masteryState(doc?.mastery),
});

export const lessonPayload = (s) =>
  withOptional({
    moduleId: s.moduleId,
    slug: str(s.slug),
    ...basePayload(s),
    estimatedMinutes: num(s.estimatedMinutes),
    blocks: s.blocks.map(blockPayload),
    mastery: masteryPayload(s.mastery),
  });

// --- Exams ---------------------------------------------------------------------------------

export function examSectionState(sec = {}) {
  return {
    uid: uid(),
    key: sec.key ?? "",
    title: locState(sec.title),
    instructions: locState(sec.instructions),
    exerciseIds: [...(sec.exerciseIds ?? [])],
  };
}

export const examState = (doc, defaults = {}) => ({
  levelCode: doc?.levelCode ?? defaults.levelCode ?? "A1",
  slug: doc?.slug ?? "",
  ...baseState(doc),
  instructions: locState(doc?.instructions),
  timed: doc ? doc.durationMinutes != null : true,
  durationMinutes: doc?.durationMinutes != null ? String(doc.durationMinutes) : "60",
  passPercent: String(Math.round((doc?.passThreshold ?? 0.6) * 1000) / 10),
  reviewPolicy: doc?.reviewPolicy ?? "full",
  sections: (doc?.sections ?? []).map(examSectionState),
});

export const examPayload = (s) =>
  withOptional({
    levelCode: s.levelCode,
    slug: str(s.slug),
    ...basePayload(s),
    instructions: locOptional(s.instructions),
    durationMinutes: s.timed ? num(s.durationMinutes) : null,
    passThreshold: s.passPercent === "" ? undefined : Number(s.passPercent) / 100,
    reviewPolicy: s.reviewPolicy,
    sections: s.sections.map((sec) =>
      withOptional({ key: str(sec.key), title: locRequired(sec.title), instructions: locOptional(sec.instructions), exerciseIds: sec.exerciseIds }),
    ),
  });

// --- Vocabulary ----------------------------------------------------------------------------

export const vocabularyState = (doc, defaults = {}) => ({
  levelCode: doc?.levelCode ?? defaults.levelCode ?? "A1",
  slug: doc?.slug ?? "",
  lemma: doc?.lemma ?? "",
  article: doc?.article ?? "",
  plural: doc?.plural ?? "",
  pos: doc?.pos ?? "noun",
  meanings: locState(doc?.meanings),
  example: locState(doc?.example),
  notes: locState(doc?.notes),
  image: imageState(doc?.image),
  topics: (doc?.topics ?? []).join(", "),
  ...commonState(doc),
});

export const vocabularyPayload = (s) =>
  withOptional({
    levelCode: s.levelCode,
    slug: str(s.slug),
    lemma: s.lemma,
    article: s.article || null,
    plural: str(s.plural) ?? null,
    pos: s.pos,
    meanings: locRequired(s.meanings),
    example: locOptional(s.example),
    notes: locOptional(s.notes),
    image: imagePayload(s.image),
    topics: slugList(s.topics),
    ...commonPayload(s),
  });

// --- Grammar topics ------------------------------------------------------------------------

export function sectionState(sec = {}) {
  return {
    uid: uid(),
    heading: locState(sec.heading),
    body: locState(sec.body),
    hasTable: Boolean(sec.table),
    table: sec.table
      ? { headers: [...sec.table.headers], rows: sec.table.rows.map((r) => sec.table.headers.map((_, i) => r[i] ?? "")) }
      : { headers: ["", ""], rows: [["", ""]] },
    examples: (sec.examples ?? []).map((e) => ({ uid: uid(), text: locState(e) })),
  };
}

export const sectionPayload = (sec) =>
  withOptional({
    heading: locOptional(sec.heading),
    body: locOptional(sec.body),
    table: sec.hasTable ? { headers: sec.table.headers, rows: sec.table.rows } : undefined,
    examples: sec.examples.map((e) => locOptional(e.text)).filter(Boolean),
  });

export const grammarState = (doc, defaults = {}) => ({
  levelCode: doc?.levelCode ?? defaults.levelCode ?? "A1",
  slug: doc?.slug ?? "",
  title: locState(doc?.title),
  summary: locState(doc?.summary),
  sections: (doc?.sections ?? [{}]).map(sectionState),
  ...commonState(doc),
});

export const grammarPayload = (s) =>
  withOptional({
    levelCode: s.levelCode,
    slug: str(s.slug),
    title: locRequired(s.title),
    summary: locOptional(s.summary),
    sections: s.sections.map(sectionPayload),
    ...commonPayload(s),
  });

// --- Exercises -------------------------------------------------------------------------------

export const cueState = (c) => ({ text: c?.text ?? "", voice: c?.voice ?? "female", rate: c?.rate ?? "slow" });
const cuePayload = (c) => ({ text: c.text, voice: c.voice, rate: c.rate });
// Listening audio (stimulus, item audio) may carry an attached recording's id.
const itemAudioState = (c) => ({ ...cueState(c), mediaId: c?.mediaId ?? "" });
const itemAudioPayload = (c) => withOptional({ ...cuePayload(c), mediaId: str(c.mediaId) });

// Every item keeps the fields of all types, so switching type doesn't lose shared fields.
export function itemState(item = {}) {
  return {
    uid: uid(),
    type: item.type ?? "mcq",
    id: item.id ?? "",
    prompt: locState(item.prompt),
    hasAudio: Boolean(item.audio),
    audio: itemAudioState(item.audio),
    explanation: locState(item.explanation),
    // mcq
    options: (item.options ?? [{ id: "a" }, { id: "b" }, { id: "c" }]).map((o) => ({ uid: uid(), id: o.id, text: locState(o.text) })),
    answer: typeof item.answer === "string" ? item.answer : "",
    // true_false
    statement: locState(item.statement),
    truth: typeof item.answer === "boolean" ? item.answer : true,
    // text_input
    label: item.label ?? "",
    before: item.before ?? "",
    after: item.after ?? "",
    accepted: (item.accepted ?? []).join("\n"),
    caseSensitive: item.caseSensitive ?? false,
    umlautTolerant: item.umlautTolerant ?? true,
    ignoreSpaces: item.ignoreSpaces ?? false,
    inputMode: item.inputMode ?? "text",
    // match
    pairs: (item.pairs ?? [{ id: "p1" }, { id: "p2" }]).map((p) => ({ uid: uid(), id: p.id, left: locState(p.left), right: locState(p.right) })),
    // order
    tokens: (item.tokens ?? []).join("\n"),
    alternatives: (item.alternatives ?? []).join("\n"),
    // speak_prompt
    cue: locState(item.cue),
    modelAnswer: locState(item.modelAnswer),
    hasModelAudio: Boolean(item.modelAudio),
    modelAudio: cueState(item.modelAudio),
  };
}

export function itemPayload(s) {
  const base = withOptional({
    type: s.type,
    id: s.id,
    prompt: locOptional(s.prompt),
    audio: s.hasAudio ? itemAudioPayload(s.audio) : undefined,
    explanation: locOptional(s.explanation),
  });
  switch (s.type) {
    case "mcq":
      return { ...base, options: s.options.map((o) => ({ id: o.id, text: locRequired(o.text) })), answer: s.answer };
    case "true_false":
      return { ...base, statement: locRequired(s.statement), answer: s.truth };
    case "text_input":
      return withOptional({
        ...base,
        label: str(s.label),
        before: str(s.before),
        after: str(s.after),
        accepted: lines(s.accepted),
        caseSensitive: s.caseSensitive,
        umlautTolerant: s.umlautTolerant,
        ignoreSpaces: s.ignoreSpaces,
        inputMode: s.inputMode,
      });
    case "match":
      return { ...base, pairs: s.pairs.map((p) => ({ id: p.id, left: locRequired(p.left), right: locRequired(p.right) })) };
    case "order":
      return { ...base, tokens: lines(s.tokens), alternatives: lines(s.alternatives) };
    case "speak_prompt":
      return withOptional({
        ...base,
        cue: locOptional(s.cue),
        modelAnswer: locRequired(s.modelAnswer),
        modelAudio: s.hasModelAudio ? cuePayload(s.modelAudio) : undefined,
      });
    default:
      return base;
  }
}

export function stimulusState(st) {
  return {
    text: locState(st?.text),
    textKind: st?.textKind ?? "",
    lines: (st?.audio?.lines ?? []).map((l) => ({ uid: uid(), speaker: l.speaker ?? "", ...cueState(l) })),
    mediaId: st?.audio?.mediaId ?? "",
    image: imageState(st?.image),
    transcriptPolicy: st?.transcriptPolicy ?? "after_submit",
    maxPlays: st?.maxPlays != null ? String(st.maxPlays) : "",
  };
}

export const stimulusPayload = (st) =>
  withOptional({
    text: locOptional(st.text),
    textKind: str(st.textKind),
    audio: st.lines.length
      ? withOptional({ lines: st.lines.map((l) => withOptional({ ...cuePayload(l), speaker: str(l.speaker) })), mediaId: str(st.mediaId) })
      : undefined,
    image: imagePayload(st.image),
    transcriptPolicy: st.transcriptPolicy,
    maxPlays: num(st.maxPlays) ?? null,
  });

export const exerciseState = (doc, defaults = {}) => ({
  levelCode: doc?.levelCode ?? defaults.levelCode ?? "A1",
  slug: doc?.slug ?? "",
  skill: doc?.skill ?? defaults.skill ?? "vocabulary",
  title: locState(doc?.title),
  instructions: locState(doc?.instructions),
  hasStimulus: Boolean(doc?.stimulus),
  stimulus: stimulusState(doc?.stimulus),
  items: (doc?.items ?? [{ id: "q1" }]).map(itemState),
  itemAudioMaxPlays: doc?.itemAudioMaxPlays != null ? String(doc.itemAudioMaxPlays) : "",
  passThreshold: String(Math.round((doc?.passThreshold ?? 0.6) * 1000) / 10),
  ...commonState(doc),
});

export const exercisePayload = (s) =>
  withOptional({
    levelCode: s.levelCode,
    slug: str(s.slug),
    skill: s.skill,
    title: locRequired(s.title),
    instructions: locOptional(s.instructions),
    stimulus: s.hasStimulus ? stimulusPayload(s.stimulus) : undefined,
    items: s.items.map(itemPayload),
    itemAudioMaxPlays: num(s.itemAudioMaxPlays) ?? null,
    passThreshold: s.passThreshold === "" ? undefined : Number(s.passThreshold) / 100,
    ...commonPayload(s),
  });
