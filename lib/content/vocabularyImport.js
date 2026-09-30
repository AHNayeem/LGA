import { parseDelimited } from "@/lib/content/csv";
import { slugify, vocabularyPayload } from "@/lib/content/payload";
import { ARTICLES, LEVEL_CODES, PARTS_OF_SPEECH, SOURCE_TYPE_OPTIONS } from "@/lib/content/constants";

// Bulk vocabulary import: the canonical column list and the mapping from a spreadsheet row
// to the vocabulary payload. Pure code, shared by the browser (parsing, template, preview
// table) and the server (vocabularyImportService), so both read a row the same way.
//
// A row becomes exactly what the word editor would send: the row fills the editor state
// and `vocabularyPayload` (lib/content/payload.js, the same function the word editor uses)
// builds the payload, which the server validates with `vocabularySchema`. The import adds no rules of its own: images
// and reference links are set in the word editor, and the review/publish state can't be
// imported (new words are always drafts).

export const IMPORT_LIMITS = Object.freeze({
  maxRows: 5000,
  maxBytes: 3 * 1024 * 1024, // request body and source text
  maxCellLength: 2000, // raw cell text; the schema's own limits are shorter for most fields
  insertChunk: 500,
});

// Column order is the template order, and the order used when pasted data has no header
// row. `aliases` are other header names accepted for the same column (case, spaces,
// hyphens and underscores are ignored when matching).
export const IMPORT_COLUMNS = Object.freeze([
  { key: "lemma", label: "Word (lemma)", required: true, aliases: ["word", "wort"], hint: "Without the article, e.g. Sprache." },
  { key: "article", label: "Article", hint: `${ARTICLES.join(", ")} or empty. Required for nouns.` },
  { key: "plural", label: "Plural", hint: "With article, e.g. die Sprachen. Empty if not applicable." },
  { key: "pos", label: "Part of speech", required: true, aliases: ["partofspeech"], hint: PARTS_OF_SPEECH.join(", ") },
  { key: "meaning_en", label: "English meaning", required: true, aliases: ["translation"], hint: "Required." },
  { key: "example_de", label: "German example", hint: "Required when an example translation is given." },
  { key: "example_en", label: "Example (English)" },
  { key: "level", label: "Level", aliases: ["levelcode"], hint: `${LEVEL_CODES.join(", ")}. Empty: the default level chosen on the import page.` },
  { key: "topics", label: "Topics", hint: "Topic slugs separated by commas or spaces, e.g. familie, wohnen." },
  { key: "tags", label: "Tags", hint: "Slugs separated by commas or spaces." },
  { key: "slug", label: "Slug", hint: "Unique per level. Empty: made from the word, as in the word editor." },
  { key: "meaning_de", label: "Meaning (German)" },
  { key: "meaning_bn", label: "Meaning (Bangla)" },
  { key: "example_bn", label: "Example (Bangla)" },
  { key: "notes_en", label: "Notes (English)" },
  { key: "notes_de", label: "Notes (German)" },
  { key: "notes_bn", label: "Notes (Bangla)" },
  { key: "sourceType", label: "Source type", hint: `${SOURCE_TYPE_OPTIONS.map((o) => o.value).join(", ")}. Empty: the default source chosen on the import page.` },
  { key: "sourceReference", label: "Source reference", hint: "Required for licensed content. Empty: the default reference." },
]);

export const IMPORT_COLUMN_KEYS = Object.freeze(IMPORT_COLUMNS.map((c) => c.key));

// Header names that look like vocabulary fields but can't be imported, with the reason.
const NOT_IMPORTABLE = {
  status: "New words are always imported as drafts; review and publish them in the CMS.",
  reviewstatus: "New words are always imported as drafts; review and publish them in the CMS.",
  publishstatus: "New words are always imported as drafts; review and publish them in the CMS.",
  image: "Attach pictures in the word editor after the import.",
  refs: "Link references in the word editor after the import.",
};

const norm = (h) => String(h ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
const HEADER_NAMES = new Map(IMPORT_COLUMNS.flatMap((c) => [c.key, ...(c.aliases ?? [])].map((name) => [norm(name), c.key])));

// Reads the header row. The first record is a header when one of its cells names a known
// column; otherwise the data is taken to be in template order (a paste without headers).
export function resolveColumns(firstCells) {
  const known = firstCells.map((c) => HEADER_NAMES.get(norm(c)) ?? null);
  if (!known.some(Boolean)) return { hasHeader: false, columns: IMPORT_COLUMN_KEYS.slice(), errors: [] };
  const errors = [];
  const seen = new Set();
  firstCells.forEach((cell, i) => {
    const name = String(cell).trim();
    if (!name) return;
    const key = known[i];
    if (!key) {
      const reason = NOT_IMPORTABLE[norm(name)];
      errors.push(`Column "${name}" can't be imported. ${reason ?? `Supported columns: ${IMPORT_COLUMN_KEYS.join(", ")}.`}`);
    } else if (seen.has(key)) {
      errors.push(`Column "${name}" appears twice.`);
    } else seen.add(key);
  });
  if (!seen.has("lemma")) errors.push('The header row needs a "lemma" (or "word") column.');
  return { hasHeader: true, columns: known, errors };
}

// Source text → rows for the preview. Structural checks only (size, row count, header,
// cell count and length); every content rule is checked on the server.
//   rows:   [{ row, values: { [columnKey]: string } }]   row = spreadsheet row number
//   errors: problems with the whole input (nothing can be previewed)
//   rowErrors: { [row]: [message] } rows that can't be read
export function readImportSource(text, { limits = IMPORT_LIMITS } = {}) {
  const source = String(text ?? "");
  if (new TextEncoder().encode(source).byteLength > limits.maxBytes) {
    return { rows: [], errors: [`The data is larger than ${Math.round(limits.maxBytes / 1048576)} MB. Split it into several imports.`], rowErrors: {} };
  }
  const parsed = parseDelimited(source);
  const { delimiter, errors: parseErrors } = parsed;
  const records = parsed.records.filter((r) => r.cells.some((c) => c.trim()));
  const rowErrors = {};
  for (const e of parseErrors) (rowErrors[e.row] ??= []).push(e.message);
  if (records.length === 0) {
    return { rows: [], delimiter, errors: parseErrors.length ? [] : ["There is no data to import."], rowErrors };
  }
  const { hasHeader, columns, errors } = resolveColumns(records[0].cells);
  if (errors.length) return { rows: [], delimiter, hasHeader, errors, rowErrors };
  const data = hasHeader ? records.slice(1) : records;
  if (data.length > limits.maxRows) {
    return { rows: [], delimiter, hasHeader, errors: [`${data.length} rows is more than the limit of ${limits.maxRows} per import. Split the data into several imports.`], rowErrors };
  }
  const rows = [];
  for (const { row, cells } of data) {
    const problems = [];
    if (cells.length > columns.length && cells.slice(columns.length).some((c) => c.trim())) {
      problems.push(`This row has ${cells.length} cells but there are only ${columns.length} columns.`);
    }
    const values = {};
    columns.forEach((key, i) => {
      if (!key) return;
      const v = (cells[i] ?? "").trim();
      if (v.length > limits.maxCellLength) problems.push(`The ${key} cell is longer than ${limits.maxCellLength} characters.`);
      else if (v) values[key] = v;
    });
    if (problems.length) rowErrors[row] = [...(rowErrors[row] ?? []), ...problems];
    else rows.push({ row, values });
  }
  return { rows, delimiter, hasHeader, errors: [], rowErrors };
}

// Case and spacing are normalised for the enum columns only ("Noun", "proper noun", "a1").
const lower = (v) => (v ?? "").trim().toLowerCase();
const enumValue = (v) => lower(v).replace(/[\s-]+/g, "_");

// One row → the payload the word editor would send for it. `defaults` are the import
// page's explicit choices for rows without a level or source: { levelCode, sourceType,
// sourceReference }. The slug, when empty, is made from the lemma as in the editor.
export function rowToVocabularyInput(values, defaults = {}) {
  const v = (k) => values[k] ?? "";
  const lemma = v("lemma");
  const hasOwnSource = Boolean(v("sourceType"));
  return vocabularyPayload({
    levelCode: v("level").toUpperCase() || defaults.levelCode || undefined,
    slug: v("slug") || slugify(lemma),
    lemma,
    article: lower(v("article")),
    plural: v("plural"),
    pos: enumValue(v("pos")) || undefined,
    meanings: { de: v("meaning_de"), en: v("meaning_en"), bn: v("meaning_bn") },
    example: { de: v("example_de"), en: v("example_en"), bn: v("example_bn") },
    notes: { de: v("notes_de"), en: v("notes_en"), bn: v("notes_bn") },
    image: undefined,
    topics: v("topics"),
    tags: v("tags"),
    refs: [],
    sourceType: (hasOwnSource ? enumValue(v("sourceType")) : defaults.sourceType) || undefined,
    // A row's own source type comes with its own reference (or none), never the default's.
    sourceReference: hasOwnSource ? v("sourceReference") : v("sourceReference") || (defaults.sourceReference ?? ""),
  });
}

// The downloadable template: every column, and two example rows.
export function templateRows() {
  const examples = [
    { lemma: "Haus", article: "das", plural: "die Häuser", pos: "noun", meaning_en: "house", example_de: "Das Haus ist groß.", example_en: "The house is big.", level: "A1", topics: "wohnen" },
    { lemma: "gehen", pos: "verb", meaning_en: "to go, to walk", example_de: "Ich gehe nach Hause.", example_en: "I am going home.", level: "A1" },
  ];
  return [IMPORT_COLUMN_KEYS, ...examples.map((e) => IMPORT_COLUMN_KEYS.map((k) => e[k] ?? ""))];
}
