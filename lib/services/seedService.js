import { COLLECTIONS } from "@/lib/db/collections";
import { serialize } from "@/lib/db/serialize";
import { editPatch, initialLifecycle } from "@/lib/content/lifecycle";
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

async function seedReference(raw, parentId) {
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
  const saved = await referenceRepository.findOne({ slug: data.slug });
  let inserted = res.inserted ? 1 : 0;
  for (const child of children) inserted += await seedReference(child, saved._id);
  return inserted;
}

export async function seedReferences(references) {
  let inserted = 0;
  for (const ref of references) inserted += await seedReference(ref, null);
  return { inserted };
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

const LIFECYCLE_KEYS = new Set([
  "_id",
  ...Object.keys(initialLifecycle({ sourceType: "system" })),
  "publishStatus",
  "reviewStatus",
]);

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

function contentBody(doc) {
  return Object.fromEntries(Object.entries(doc).filter(([k]) => !LIFECYCLE_KEYS.has(k)));
}

export function sameContent(stored, body) {
  return JSON.stringify(canonical(serialize(contentBody(stored)))) === JSON.stringify(canonical(serialize(body)));
}

async function syncOne(kind, repo, filter, input, provenance, { update, stats }) {
  const { sourceType, sourceReference, ...parsed } = parseOrThrow(contentSchemaFor(kind), { ...input, ...provenance }, `Invalid ${kind} "${input.slug}".`);
  const body = toStorage(kind, parsed);
  const existing = await repo.findOne(filter);
  if (!existing) {
    const created = await repo.insert({ ...body, ...initialLifecycle({ sourceType, sourceReference }) });
    stats.inserted++;
    return created._id;
  }
  if (update && !sameContent(existing, body)) {
    // Fields removed from the seed are cleared.
    const removed = Object.fromEntries(
      Object.keys(contentBody(existing))
        .filter((k) => !(k in body) && existing[k] !== null)
        .map((k) => [k, null]),
    );
    await repo.updateIfVersion(existing._id, existing.version, editPatch(existing, { ...removed, ...body }, null));
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
