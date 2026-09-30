import { randomUUID } from "node:crypto";
import { z } from "zod";
import { COLLECTIONS } from "@/lib/db/collections";
import { serialize } from "@/lib/db/serialize";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { levelCode, parseOrThrow, toObjectId } from "@/lib/validation/common";
import { initialLifecycle, PUBLISH_STATUS, SOURCE_TYPES } from "@/lib/content/lifecycle";
import { contentSchemaFor, toStorage } from "@/lib/services/contentService";
import { vocabularyRepository } from "@/lib/repositories/contentRepository";
import { IMPORT_COLUMN_KEYS, IMPORT_LIMITS, rowToVocabularyInput } from "@/lib/content/vocabularyImport";
import { wordForm } from "@/lib/content/adminSections";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

// Bulk vocabulary import (admin CMS). The browser only parses the file or pasted text
// (lib/content/vocabularyImport.js); everything here runs again for every request, so a
// commit never relies on an earlier preview:
//   1. permission (content:write, as for creating a word) and rate limit
//   2. each row → the word editor's payload → vocabularySchema (the CMS rules, unchanged)
//   3. duplicates: the same level + slug (the unique index) in the file or in the library
//      is an error; the same level + article + lemma is a warning, because the CMS allows
//      one word with several meanings (die Bank: bench / bank)
//   4. commit only: any row with an error rejects the whole request before anything is
//      written; otherwise the rows are inserted in chunks with the normal initial
//      lifecycle (draft, unpublished, createdBy = the admin), as createContent does
// A word taken by someone else between the checks and the insert (a race on the unique
// index) fails for that row only and is reported; no row is reported imported unless it
// was stored.

const VOCABULARY = COLLECTIONS.vocabulary;

// Request body: { defaults, columns, rows: [[rowNumber, ...cells]] }. Cells are strings
// in the order of `columns` (a subset of the import columns).
const cell = z.string().max(IMPORT_LIMITS.maxCellLength, `A cell is longer than ${IMPORT_LIMITS.maxCellLength} characters.`);
const importRequestSchema = z
  .object({
    defaults: z
      .object({
        levelCode: levelCode.optional().or(z.literal("")),
        sourceType: z.enum(SOURCE_TYPES).optional().or(z.literal("")),
        sourceReference: z.string().max(500).optional(),
      })
      .strict()
      .default({}),
    columns: z.array(z.enum(IMPORT_COLUMN_KEYS)).min(1).max(IMPORT_COLUMN_KEYS.length),
    rows: z
      .array(z.array(z.union([z.number().int().min(1).max(1_000_000), cell])).min(1))
      .min(1, "There are no rows to import.")
      .max(IMPORT_LIMITS.maxRows, `An import can have at most ${IMPORT_LIMITS.maxRows} rows.`),
  })
  .strict()
  .superRefine((req, ctx) => {
    if (new Set(req.columns).size !== req.columns.length) ctx.addIssue({ code: "custom", path: ["columns"], message: "A column appears twice." });
    const numbers = new Set();
    req.rows.forEach((r, i) => {
      const [row, ...cells] = r;
      if (typeof row !== "number" || cells.some((c) => typeof c !== "string") || cells.length > req.columns.length) {
        ctx.addIssue({ code: "custom", path: ["rows", i], message: "Malformed row." });
      } else if (numbers.has(row)) ctx.addIssue({ code: "custom", path: ["rows", i], message: `Row ${row} appears twice.` });
      else numbers.add(row);
    });
  });

function parseRequest(input) {
  const req = parseOrThrow(importRequestSchema, input, "The import data could not be read.");
  const rows = req.rows.map(([row, ...cells]) => ({
    row,
    values: Object.fromEntries(req.columns.map((key, i) => [key, (cells[i] ?? "").trim()]).filter(([, v]) => v)),
  }));
  return { defaults: req.defaults, rows };
}

// The route calls this before it reads the request body. Each operation checks the
// permission again; `countRequest: false` means the route already counted this request.
export async function assertCanImportVocabulary(actor, { countRequest = true } = {}) {
  if (!hasPermission(actor, PERMISSIONS.contentWrite)) throw new ForbiddenError();
  if (countRequest) await enforceRateLimit(RATE_LIMITS.vocabularyImportByUser, actor.id);
}

// --- Row messages ---------------------------------------------------------------------

const LOCALE_NAMES = { de: "German", en: "English", bn: "Bangla" };
const FIELD_LABELS = {
  levelCode: "Level",
  slug: "Slug",
  lemma: "Word (lemma)",
  article: "Article",
  plural: "Plural",
  pos: "Part of speech",
  meanings: "Meaning",
  example: "Example",
  notes: "Notes",
  topics: "Topics",
  tags: "Tags",
  sourceType: "Source type",
  sourceReference: "Source reference",
};
// The raw cell a field came from, for "… "thing" is not supported".
const FIELD_COLUMN = { levelCode: "level", pos: "pos", article: "article", sourceType: "sourceType", slug: "slug" };

function fieldLabel(path) {
  const [field, sub] = path;
  const base = FIELD_LABELS[field] ?? String(field ?? "Row");
  if (["meanings", "example", "notes"].includes(field) && LOCALE_NAMES[sub]) {
    return field === "meanings" ? `${LOCALE_NAMES[sub]} meaning` : `${base} (${LOCALE_NAMES[sub]})`;
  }
  if (["topics", "tags"].includes(field) && typeof sub === "number") return field === "topics" ? "Topic" : "Tag";
  return base;
}

function valueAt(input, path) {
  return path.reduce((v, k) => (v == null ? v : v[k]), input);
}

// One Zod issue → a sentence an editor understands. Schema messages that are already
// sentences (e.g. "Nouns need an article") are kept.
function issueMessage(issue, input, values) {
  const path = issue.path;
  const field = path[0];
  const label = fieldLabel(path);
  const value = valueAt(input, path);
  const raw = values[FIELD_COLUMN[field]] ?? (typeof value === "string" ? value : "");
  const missing = value == null || value === "";
  if (field === "levelCode" && missing) return "Level is required: fill the level column or choose a default level.";
  if (field === "slug" && missing) return "Slug is required: it can't be made from this word, so fill the slug column.";
  if (field === "sourceType" && missing) return "Source type is required: fill the sourceType column or choose a default source.";
  if (field === "meanings" && path.length === 1 && issue.code === "custom") return "English meaning is required.";
  // Schema sentences ("Nouns need an article") are kept; "<locale> is required" is reworded below.
  if (issue.code === "custom" && !/^[a-z]{2} is required$/.test(issue.message)) return issue.message;
  if (issue.code === "invalid_value" || (issue.code === "invalid_type" && !missing)) {
    const allowed = issue.values ? ` Use one of: ${issue.values.join(", ")}.` : "";
    return `${label} "${raw}" is not supported.${allowed}`;
  }
  if (issue.code === "too_big" && issue.origin === "string") return `${label} is too long (at most ${issue.maximum} characters).`;
  if (issue.code === "too_big" && issue.origin === "array") return `Too many ${label.toLowerCase()} (at most ${issue.maximum}).`;
  if (issue.code === "invalid_format") return `${label} "${value}" is not valid: use lowercase letters, numbers and hyphens.`;
  if (missing || issue.code === "too_small") {
    if (field === "example" && path[1] === "de") return "German example is required when an example translation is given.";
    return `${label} is required.`;
  }
  return `${label}: ${issue.message}`;
}

// --- Analysis (preview and commit) ------------------------------------------------------

const PROJECTION = { _id: 1, levelCode: 1, slug: 1, lemma: 1, article: 1, meanings: 1, publishStatus: 1 };
const formKey = (levelCode, article, lemma) => `${levelCode}|${article ?? ""}|${lemma.normalize("NFC").toLocaleLowerCase("de")}`;

async function analyze(rows, defaults) {
  const schema = contentSchemaFor(VOCABULARY);
  const results = rows.map(({ row, values }) => {
    const input = rowToVocabularyInput(values, defaults);
    const parsed = schema.safeParse(input);
    const errors = parsed.success ? [] : [...new Set(parsed.error.issues.map((i) => issueMessage(i, input, values)))];
    return { row, values, input, data: parsed.success ? parsed.data : null, errors, warnings: [] };
  });
  const valid = results.filter((r) => r.data);

  // Duplicates inside the data.
  const bySlug = new Map();
  const byForm = new Map();
  for (const r of valid) {
    const { levelCode: level, slug, article, lemma } = r.data;
    const slugKey = `${level}|${slug}`;
    const first = bySlug.get(slugKey);
    if (first) r.errors.push(`Slug "${slug}" (${level}) is also used by row ${first.row}. Give one of the rows its own slug.`);
    else bySlug.set(slugKey, r);
    const key = formKey(level, article, lemma);
    const same = byForm.get(key);
    if (same) r.warnings.push(`Same word as row ${same.row} (${wordForm(r.data)}). Keep both only if they are different meanings.`);
    else byForm.set(key, r);
  }

  // Duplicates against the library: one query per kind of check, not one per row.
  const [slugHits, formHits] = await Promise.all([
    vocabularyRepository.findByLevelSlugs(
      valid.map((r) => ({ levelCode: r.data.levelCode, slug: r.data.slug })),
      { projection: PROJECTION },
    ),
    vocabularyRepository.findByLemmas(
      valid.map((r) => r.data.levelCode),
      valid.map((r) => r.data.lemma),
      { projection: PROJECTION },
    ),
  ]);
  const existingBySlug = new Map(slugHits.map((d) => [`${d.levelCode}|${d.slug}`, d]));
  const existingByForm = new Map();
  for (const d of formHits) {
    const key = formKey(d.levelCode, d.article, d.lemma);
    if (!existingByForm.has(key)) existingByForm.set(key, []);
    existingByForm.get(key).push(d);
  }
  for (const r of valid) {
    const { levelCode: level, slug, article, lemma } = r.data;
    const taken = existingBySlug.get(`${level}|${slug}`);
    if (taken) {
      const archived = taken.publishStatus === PUBLISH_STATUS.archived ? ", archived" : "";
      r.errors.push(`A word with slug "${slug}" already exists in ${level} (${wordForm(taken)}${archived}). Give this row its own slug.`);
    }
    for (const d of existingByForm.get(formKey(level, article, lemma)) ?? []) {
      if (taken && String(d._id) === String(taken._id)) continue;
      const meaning = d.meanings?.en ? `, meaning "${d.meanings.en}"` : "";
      r.warnings.push(`${wordForm(d)} is already in the ${level} library (slug "${d.slug}"${meaning}). Keep it only if this is a different meaning.`);
    }
  }
  return results;
}

const statusOf = (r) => (r.errors.length ? "error" : r.warnings.length ? "warning" : "valid");

function rowView(r) {
  const d = r.data ?? r.input;
  return {
    row: r.row,
    status: statusOf(r),
    levelCode: d.levelCode ?? null,
    slug: d.slug ?? null,
    errors: r.errors,
    warnings: r.warnings,
  };
}

function totals(results) {
  const count = (s) => results.filter((r) => statusOf(r) === s).length;
  return { total: results.length, valid: count("valid"), warnings: count("warning"), errors: count("error") };
}

// Dry run: every check of the import, nothing is written.
//   → { totals, rows: [{ row, status, levelCode, slug, errors, warnings }] }
export async function previewVocabularyImport(actor, input, { rateLimited = false } = {}) {
  await assertCanImportVocabulary(actor, { countRequest: !rateLimited });
  const { rows, defaults } = parseRequest(input);
  const results = await analyze(rows, defaults);
  return { totals: totals(results), rows: results.map(rowView) };
}

// Imports every row, or none when a row has an error (ValidationError, fieldErrors keyed
// "row.<n>"). → { importId, totals, imported: [{ row, id, slug, levelCode }],
//                  failed: [{ row, message }] }
export async function importVocabulary(actor, input, { rateLimited = false } = {}) {
  await assertCanImportVocabulary(actor, { countRequest: !rateLimited });
  const importId = randomUUID();
  const { rows, defaults } = parseRequest(input);
  const results = await analyze(rows, defaults);
  const summary = totals(results);
  const blocked = results.filter((r) => r.errors.length);
  if (blocked.length) {
    logger.info("vocabulary_import_rejected", { importId, actor: actor.id, total: summary.total, errors: blocked.length });
    const fieldErrors = Object.fromEntries(blocked.map((r) => [`row.${r.row}`, r.errors]));
    throw new ValidationError(`${blocked.length} row(s) have errors, so nothing was imported. Fix or remove them and try again.`, fieldErrors);
  }

  const createdBy = toObjectId(actor.id);
  const docs = results.map((r) => {
    const { sourceType, sourceReference, ...body } = r.data;
    return { ...toStorage(VOCABULARY, body), ...initialLifecycle({ sourceType, sourceReference, createdBy }) };
  });

  const imported = [];
  const failed = [];
  for (let start = 0; start < docs.length; start += IMPORT_LIMITS.insertChunk) {
    const chunk = docs.slice(start, start + IMPORT_LIMITS.insertChunk);
    const outcome = await vocabularyRepository.insertMany(chunk);
    for (const { index, id } of outcome.inserted) {
      const r = results[start + index];
      imported.push({ row: r.row, id: String(id), slug: r.data.slug, levelCode: r.data.levelCode });
    }
    for (const { index, duplicate } of outcome.failed) {
      const r = results[start + index];
      failed.push({
        row: r.row,
        message: duplicate
          ? `A word with slug "${r.data.slug}" was added to ${r.data.levelCode} while importing. Give this row its own slug.`
          : "This row could not be saved. Try importing it again.",
      });
    }
    if (outcome.error) {
      logger.error("vocabulary_import_write_failed", { importId, err: outcome.error });
      // The database is failing: rows after this chunk are not attempted.
      for (const r of results.slice(start + chunk.length)) failed.push({ row: r.row, message: "Not imported: the import stopped after a database error. Try again." });
      break;
    }
  }
  imported.sort((a, b) => a.row - b.row);
  failed.sort((a, b) => a.row - b.row);

  logger.info("vocabulary_import", {
    importId,
    actor: actor.id,
    total: summary.total,
    imported: imported.length,
    failed: failed.length,
    warnings: summary.warnings,
    levels: [...new Set(results.map((r) => r.data.levelCode))].sort(),
  });
  return serialize({ importId, totals: summary, imported, failed });
}
