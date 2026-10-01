import { COLLECTIONS } from "@/lib/db/collections";
import { serialize } from "@/lib/db/serialize";
import { contentFields, editPatch, initialLifecycle, removedFields } from "@/lib/content/lifecycle";
import { parseOrThrow } from "@/lib/validation/common";
import { levelSchema, referenceSchema } from "@/lib/validation/content";
import {
  levelRepository,
  referenceRepository,
  moduleRepository,
  lessonRepository,
  exerciseRepository,
  vocabularyRepository,
  grammarTopicRepository,
  examRepository,
} from "@/lib/repositories/contentRepository";
import { contentSchemaFor, toStorage } from "@/lib/services/contentService";

// Idempotent: inserts missing records only. Never overwrites edited or reviewed content,
// and never approves anything.

export async function seedLevels(levels) {
  let inserted = 0;
  for (const raw of levels) {
    const { sourceType, sourceReference, ...data } = parseOrThrow(levelSchema, { ...raw, sourceType: "system" });
    const res = await levelRepository.insertIfMissing(
      { code: data.code },
      { ...data, ...initialLifecycle({ sourceType, sourceReference }) },
    );
    if (res.inserted) inserted++;
  }
  return { inserted, total: levels.length };
}

// References are structural metadata (sourceType reference_metadata), never learner
// content, so updating them needs no review: `update` refreshes title, publisher, notes,
// order and meta of existing references from the seed data (bun run seed --
// --update-references). Everything else, including their ids and links, is kept.
async function seedReference(raw, parentId, { update = false } = {}) {
  const { children = [], ...rest } = raw;
  const { sourceType, sourceReference, ...data } = parseOrThrow(referenceSchema, {
    ...rest,
    parentId: parentId ? String(parentId) : null,
    sourceType: "reference_metadata",
  });
  const res = await referenceRepository.insertIfMissing(
    { slug: data.slug },
    { ...data, parentId: parentId ?? null, ...initialLifecycle({ sourceType, sourceReference }) },
  );
  let saved = await referenceRepository.findOne({ slug: data.slug });
  const counts = { inserted: res.inserted ? 1 : 0, updated: 0 };
  if (update && !res.inserted) {
    const fields = { title: data.title, publisher: data.publisher, notes: data.notes, order: data.order, meta: data.meta };
    if (!sameContent(Object.fromEntries(Object.keys(fields).map((k) => [k, saved[k]])), fields)) {
      saved = await referenceRepository.updateMetadata(saved._id, fields);
      counts.updated = 1;
    }
  }
  for (const child of children) {
    const c = await seedReference(child, saved._id, { update });
    counts.inserted += c.inserted;
    counts.updated += c.updated;
  }
  return counts;
}

export async function seedReferences(references, { update = false } = {}) {
  const totals = { inserted: 0, updated: 0 };
  for (const ref of references) {
    const c = await seedReference(ref, null, { update });
    totals.inserted += c.inserted;
    totals.updated += c.updated;
  }
  return totals;
}

// --- Curriculum modules --------------------------------------------------------------
//
// A module definition (content/curriculum/**) references its parts by slug:
//   { levelCode, provenance: { sourceType, sourceReference }, module, vocabulary[],
//     grammar[], exercises[], lessons[] }
// Lesson blocks use { vocab: [slug] } / { grammar: slug } / { exercise: slug } and
// references use { ref: referenceSlug, note }.
//
// Default mode inserts what is missing and leaves everything else alone.
// `update: true` also applies changed seed content. Changed items go back to draft and
// are unpublished (the normal edit rule), so updated German is always re-reviewed.

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .filter((k) => value[k] !== null && value[k] !== undefined)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  }
  return value;
}

export function sameContent(stored, body) {
  return JSON.stringify(canonical(serialize(contentFields(stored)))) === JSON.stringify(canonical(serialize(body)));
}

// Recordings and images attached in the CMS (`mediaId`, `image`) are not part of the seed
// files. An update keeps them on every target that still exists, so re-seeding never
// silently drops native audio or images an admin attached.
function keepAttachedImages(kind, existing, body) {
  if (kind === COLLECTIONS.vocabulary) return existing.image && !body.image ? { ...body, image: existing.image } : body;
  if (kind === COLLECTIONS.exercises) {
    const image = existing.stimulus?.image;
    return image && body.stimulus && !body.stimulus.image ? { ...body, stimulus: { ...body.stimulus, image } } : body;
  }
  if (kind === COLLECTIONS.lessons) {
    const byKey = new Map((existing.blocks ?? []).filter((b) => b.image).map((b) => [b.key, b.image]));
    if (byKey.size === 0) return body;
    return { ...body, blocks: body.blocks.map((b) => (b.type === "intro" && !b.image && byKey.has(b.key) ? { ...b, image: byKey.get(b.key) } : b)) };
  }
  return body;
}

function keepAttachedMedia(kind, existing, input) {
  if (!existing) return input;
  const body = keepAttachedImages(kind, existing, input);
  if (kind !== COLLECTIONS.exercises) return body;
  const out = { ...body };
  const stimulusMedia = existing.stimulus?.audio?.mediaId;
  if (stimulusMedia && out.stimulus?.audio && !out.stimulus.audio.mediaId) {
    out.stimulus = { ...out.stimulus, audio: { ...out.stimulus.audio, mediaId: stimulusMedia } };
  }
  const itemMedia = new Map((existing.items ?? []).filter((i) => i.audio?.mediaId).map((i) => [i.id, i.audio.mediaId]));
  out.items = out.items.map((i) => (i.audio && !i.audio.mediaId && itemMedia.has(i.id) ? { ...i, audio: { ...i.audio, mediaId: itemMedia.get(i.id) } } : i));
  return out;
}

async function syncOne(kind, repo, filter, input, provenance, { update, stats }) {
  const { sourceType, sourceReference, ...parsed } = parseOrThrow(contentSchemaFor(kind), { ...input, ...provenance }, `Invalid ${kind} "${input.slug}".`);
  const existing = await repo.findOne(filter);
  const body = keepAttachedMedia(kind, existing, toStorage(kind, parsed));
  if (!existing) {
    const created = await repo.insert({ ...body, ...initialLifecycle({ sourceType, sourceReference }) });
    stats.inserted++;
    return created._id;
  }
  if (update && !sameContent(existing, body)) {
    // Fields removed from the seed are cleared.
    await repo.updateIfVersion(existing._id, existing.version, editPatch(existing, { ...removedFields(existing, body), ...body }, null));
    stats.updated++;
  } else {
    stats.unchanged++;
  }
  return existing._id;
}

async function resolveRefs(refs = []) {
  const out = [];
  for (const { ref, note } of refs) {
    const found = await referenceRepository.findOne({ slug: ref });
    if (!found) throw new Error(`Unknown reference "${ref}". Seed references first.`);
    out.push({ referenceId: String(found._id), ...(note ? { note } : {}) });
  }
  return out;
}

function lookup(map, kind, key) {
  const id = map.get(key);
  if (!id) throw new Error(`Lesson refers to unknown ${kind} "${key}".`);
  return String(id);
}

export async function seedCurriculumModule(def, { update = false } = {}) {
  const stats = { inserted: 0, updated: 0, unchanged: 0 };
  const opts = { update, stats };
  const { levelCode, provenance } = def;
  const level = await levelRepository.findOne({ code: levelCode });
  if (!level) throw new Error(`Level ${levelCode} does not exist. Seed levels first.`);

  const ids = { vocab: new Map(), grammar: new Map(), exercise: new Map() };

  for (const v of def.vocabulary ?? []) {
    const input = { ...v, levelCode, refs: await resolveRefs(v.refs) };
    ids.vocab.set(v.slug, await syncOne(COLLECTIONS.vocabulary, vocabularyRepository, { levelCode, slug: v.slug }, input, provenance, opts));
  }
  for (const g of def.grammar ?? []) {
    const input = { ...g, levelCode, refs: await resolveRefs(g.refs) };
    ids.grammar.set(g.slug, await syncOne(COLLECTIONS.grammarTopics, grammarTopicRepository, { levelCode, slug: g.slug }, input, provenance, opts));
  }
  for (const e of def.exercises ?? []) {
    const input = { ...e, levelCode, refs: await resolveRefs(e.refs) };
    ids.exercise.set(e.slug, await syncOne(COLLECTIONS.exercises, exerciseRepository, { levelCode, slug: e.slug }, input, provenance, opts));
  }

  const m = def.module;
  const moduleId = await syncOne(
    COLLECTIONS.modules,
    moduleRepository,
    { levelCode, slug: m.slug },
    { ...m, levelCode, refs: await resolveRefs(m.refs) },
    provenance,
    opts,
  );

  for (const l of def.lessons ?? []) {
    const blocks = l.blocks.map(({ vocab, grammar, exercise, ...b }) => {
      if (vocab) return { ...b, vocabIds: vocab.map((s) => lookup(ids.vocab, "vocabulary", s)) };
      if (grammar) return { ...b, refId: lookup(ids.grammar, "grammar topic", grammar) };
      if (exercise) return { ...b, refId: lookup(ids.exercise, "exercise", exercise) };
      return b;
    });
    const input = { ...l, moduleId: String(moduleId), blocks, refs: await resolveRefs(l.refs) };
    await syncOne(COLLECTIONS.lessons, lessonRepository, { moduleId, slug: l.slug }, input, provenance, opts);
  }

  return { module: m.slug, moduleId: String(moduleId), ...stats };
}

// --- Exams ---------------------------------------------------------------------------
//
// An exam definition (content/exams/**) references its own exercises by slug:
//   { levelCode, provenance, exam: { slug, …, sections: [{ key, title, exercises: [slug] }] },
//     exercises[] }
// Same rules as modules: missing items are inserted as drafts; `update: true` applies
// changed items and sends them back to draft.
export async function seedExam(def, { update = false } = {}) {
  const stats = { inserted: 0, updated: 0, unchanged: 0 };
  const opts = { update, stats };
  const { levelCode, provenance } = def;
  if (!(await levelRepository.findOne({ code: levelCode }))) throw new Error(`Level ${levelCode} does not exist. Seed levels first.`);

  const exerciseIds = new Map();
  for (const e of def.exercises ?? []) {
    const input = { ...e, levelCode, refs: await resolveRefs(e.refs) };
    exerciseIds.set(e.slug, await syncOne(COLLECTIONS.exercises, exerciseRepository, { levelCode, slug: e.slug }, input, provenance, opts));
  }
  const { sections, refs, ...exam } = def.exam;
  const input = {
    ...exam,
    levelCode,
    refs: await resolveRefs(refs),
    sections: sections.map(({ exercises, ...sec }) => ({ ...sec, exerciseIds: exercises.map((slug) => lookup(exerciseIds, "exercise", slug)) })),
  };
  const examId = await syncOne(COLLECTIONS.exams, examRepository, { levelCode, slug: exam.slug }, input, provenance, opts);
  return { exam: exam.slug, examId: String(examId), ...stats };
}
