import { initialLifecycle } from "@/lib/content/lifecycle";
import { parseOrThrow } from "@/lib/validation/common";
import { levelSchema, referenceSchema } from "@/lib/validation/content";
import { levelRepository, referenceRepository } from "@/lib/repositories/contentRepository";

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
