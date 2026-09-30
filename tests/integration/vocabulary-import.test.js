import { afterEach, describe, expect, it, vi } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import * as content from "@/lib/services/contentService";
import { importVocabulary, previewVocabularyImport } from "@/lib/services/vocabularyImportService";
import { handleVocabularyImport } from "@/lib/http/vocabularyImport";
import { vocabularyRepository } from "@/lib/repositories/contentRepository";
import { contentFields, initialLifecycle } from "@/lib/content/lifecycle";
import { IMPORT_LIMITS, readImportSource } from "@/lib/content/vocabularyImport";
import { incrementWindow } from "@/lib/repositories/rateLimitRepository";
import { RATE_LIMITS } from "@/lib/security/rateLimit";
import { ROLES } from "@/lib/auth/roles";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";

// Bulk vocabulary import: the service (preview and commit) and its route handler.

setupTestDatabase();

afterEach(() => vi.restoreAllMocks());

const admin = () => createTestUser({ role: ROLES.ADMIN });
const vocab = async () => (await getDb()).collection("vocabulary");
const DEFAULTS = { levelCode: "A1", sourceType: "original" };

// Source text → the request body the import page sends.
function request(text, defaults = DEFAULTS) {
  const { rows, errors, rowErrors } = readImportSource(text);
  expect(errors).toEqual([]);
  expect(rowErrors).toEqual({});
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r.values)))];
  return { defaults, columns, rows: rows.map((r) => [r.row, ...columns.map((c) => r.values[c] ?? "")]) };
}

const HEADER = "lemma,article,plural,pos,meaning_en,example_de,level,topics";
const csv = (...lines) => [HEADER, ...lines].join("\n");
const byRow = (preview) => Object.fromEntries(preview.rows.map((r) => [r.row, r]));

describe("permissions", () => {
  it("only content writers can preview or import", async () => {
    const user = await createTestUser();
    const body = request(csv("Haus,das,die Häuser,noun,house,,,"));
    await expect(previewVocabularyImport(user, body)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(importVocabulary(user, body)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(importVocabulary(null, body)).rejects.toBeInstanceOf(ForbiddenError);
    // The route's early check doesn't skip the service's own permission check.
    await expect(importVocabulary(user, body, { rateLimited: true })).rejects.toBeInstanceOf(ForbiddenError);
    expect(await (await vocab()).countDocuments()).toBe(0);
  });
});

describe("import", () => {
  it("imports valid rows as drafts, exactly like words created in the word editor", async () => {
    const a = await admin();
    const result = await importVocabulary(
      a,
      request(csv('Haus,das,die Häuser,noun,house,"Das Haus ist groß.",,wohnen', "gehen,,,verb,\"to go, to walk\",Ich gehe nach Hause.,A2,")),
    );
    expect(result).toMatchObject({ totals: { total: 2, valid: 2, warnings: 0, errors: 0 }, failed: [] });
    expect(result.importId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.imported.map((r) => [r.row, r.slug, r.levelCode])).toEqual([
      [2, "haus", "A1"],
      [3, "gehen", "A2"],
    ]);

    // The same word through the normal CMS create path, for comparison.
    const edited = await content.saveContent(a, {
      kind: "vocabulary",
      data: { levelCode: "B1", slug: "haus", lemma: "Haus", article: "das", plural: "die Häuser", pos: "noun", meanings: { en: "house" }, example: { de: "Das Haus ist groß." }, topics: ["wohnen"], tags: [], refs: [], sourceType: "original" },
    });
    const col = await vocab();
    const imported = await col.findOne({ levelCode: "A1", slug: "haus" });
    const viaEditor = await col.findOne({ levelCode: "B1", slug: "haus" });
    const { levelCode: _l1, ...importedBody } = contentFields(imported);
    const { levelCode: _l2, ...editorBody } = contentFields(viaEditor);
    expect(importedBody).toEqual(editorBody);
    const lifecycleKeys = Object.keys(initialLifecycle({ sourceType: "original" }));
    const pick = (d) => Object.fromEntries(lifecycleKeys.filter((k) => !["createdAt", "updatedAt"].includes(k)).map((k) => [k, d[k]]));
    expect(pick(imported)).toEqual(pick(viaEditor));
    expect(imported).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", version: 1, approvalBasis: null });
    expect(String(imported.createdBy)).toBe(a.id);
    expect(String(imported.updatedBy)).toBe(a.id);
    expect(edited.createdBy).toBe(a.id);

    // Imported words behave like any other: editable through the CMS with the version check.
    const updated = await content.saveContent(a, {
      kind: "vocabulary",
      id: String(imported._id),
      version: 1,
      data: { ...content.contentSchemaFor("vocabulary").parse({ ...importedBody, levelCode: "A1", sourceType: "original" }), plural: "die Häuser" },
    });
    expect(updated.version).toBe(2);
  });

  it("the preview runs every check and writes nothing", async () => {
    const a = await admin();
    const preview = await previewVocabularyImport(a, request(csv("Haus,das,die Häuser,noun,house,,,", ",der,,noun,house,,,")));
    expect(preview.totals).toEqual({ total: 2, valid: 1, warnings: 0, errors: 1 });
    expect(byRow(preview)[3]).toMatchObject({ status: "error", errors: expect.arrayContaining(["Word (lemma) is required."]) });
    expect(await (await vocab()).countDocuments()).toBe(0);
  });

  it("explains every invalid row in plain language", async () => {
    const a = await admin();
    const long = "L".repeat(121);
    const text = [
      "lemma,article,pos,meaning_en,example_de,example_en,level,topics,slug,sourceType,sourceReference",
      ",der,noun,house,,,,,,,", // 2 missing lemma
      "Haus,,noun,house,,,,,,,", // 3 noun without article
      "Ding,das,thing,thing,,,,,,,", // 4 unknown part of speech
      "Haus,das,noun,house,,,A7,,haus-a7,,", // 5 unknown level
      `${long},,verb,x,,,,,,,`, // 6 too long
      "Haus,das,noun,,,,,,haus-2,,", // 7 missing English meaning
      "Haus,die,noun,house,,,,Wohnen Zuhause!,haus-3,,", // 8 invalid topic slugs
      "Haus,das,noun,house,,The house.,,,haus-4,,", // 9 example without German
      "Haus,das,noun,house,,,,,haus-5,licensed,", // 10 licensed without reference
      "Haus,das,noun,house,,,,,haus-6,stolen,", // 11 unknown source type
      "Haus,das,noun,house,,,,,Haus Slug,,", // 12 invalid slug
      "!!!,,interjection,wow,,,,,,,", // 13 no slug can be made
      "Haus,dem,noun,house,,,,,haus-7,,", // 14 unknown article
    ].join("\n");
    const rows = byRow(await previewVocabularyImport(a, request(text)));
    const errs = (n) => rows[n].errors;
    expect(errs(2)).toContain("Word (lemma) is required.");
    expect(errs(3)).toEqual(["Nouns need an article"]);
    expect(errs(4)).toEqual([expect.stringMatching(/^Part of speech "thing" is not supported\. Use one of: noun, proper_noun/)]);
    expect(errs(5)).toEqual([expect.stringMatching(/^Level "A7" is not supported\. Use one of: A1, A2/)]);
    expect(errs(6)).toEqual(["Word (lemma) is too long (at most 120 characters)."]);
    expect(errs(7)).toEqual(["English meaning is required."]);
    expect(errs(8)).toEqual([expect.stringMatching(/^Topic "Wohnen" is not valid/), expect.stringMatching(/^Topic "Zuhause!" is not valid/)]);
    expect(errs(9)).toEqual(["German example is required when an example translation is given."]);
    expect(errs(10)).toEqual(["Licensed content needs a source reference"]);
    expect(errs(11)).toEqual([expect.stringMatching(/^Source type "stolen" is not supported/)]);
    expect(errs(12)).toEqual(['Slug "Haus Slug" is not valid: use lowercase letters, numbers and hyphens.']);
    expect(errs(13)).toEqual(["Slug is required: it can't be made from this word, so fill the slug column."]);
    expect(errs(14)).toEqual([expect.stringMatching(/^Article "dem" is not supported\. Use one of: der, die, das/)]);
    const none = await previewVocabularyImport(a, request("lemma,pos,meaning_en\ngehen,verb,to go", { sourceType: "original" }));
    expect(none.rows[0].errors).toEqual(["Level is required: fill the level column or choose a default level."]);
    const noSource = await previewVocabularyImport(a, request("lemma,pos,meaning_en\ngehen,verb,to go", { levelCode: "A1" }));
    expect(noSource.rows[0].errors).toEqual(["Source type is required: fill the sourceType column or choose a default source."]);
  });

  it("rejects the whole import when any row has an error", async () => {
    const a = await admin();
    const err = await importVocabulary(a, request(csv("Haus,das,die Häuser,noun,house,,,", "Tisch,,,noun,table,,,"))).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toMatch(/1 row\(s\) have errors, so nothing was imported/);
    expect(err.fieldErrors).toEqual({ "row.3": ["Nouns need an article"] });
    expect(await (await vocab()).countDocuments()).toBe(0);
  });

  it("rejects malformed requests", async () => {
    const a = await admin();
    const bad = [
      {},
      { columns: ["lemma"], rows: [] },
      { columns: ["lemma", "status"], rows: [[2, "Haus"]] },
      { columns: ["lemma"], rows: [[2, "Haus", "extra"]] },
      { columns: ["lemma"], rows: [[2, "Haus"], [2, "Tisch"]] },
      { columns: ["lemma"], rows: [["2", "Haus"]] },
      { columns: ["lemma"], rows: [[2, "x".repeat(IMPORT_LIMITS.maxCellLength + 1)]] },
      { columns: ["lemma"], rows: Array.from({ length: IMPORT_LIMITS.maxRows + 1 }, (_, i) => [i + 2, `w${i}`]) },
      { columns: ["lemma"], rows: [[2, "Haus"]], defaults: { levelCode: "A1", reviewStatus: "approved" } },
    ];
    for (const body of bad) await expect(previewVocabularyImport(a, body)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("duplicates", () => {
  it("the same level and slug twice in the data is an error; the same slug in another level is fine", async () => {
    const a = await admin();
    const preview = await previewVocabularyImport(
      a,
      request(csv("Haus,das,die Häuser,noun,house,,,", "Haus,das,die Häuser,noun,home,,,", "Haus,das,die Häuser,noun,house,,B1,")),
    );
    const rows = byRow(preview);
    expect(rows[2].status).toBe("valid");
    expect(rows[3].errors).toEqual(['Slug "haus" (A1) is also used by row 2. Give one of the rows its own slug.']);
    expect(rows[3].warnings).toEqual([expect.stringMatching(/^Same word as row 2 \(das Haus\)/)]);
    expect(rows[4].status).toBe("valid");
  });

  it("the same word with a different meaning is a warning, and both are kept", async () => {
    const a = await admin();
    const text = csv("Bank,die,die Bänke,noun,bench,,,", "Bank,die,die Banken,noun,bank,,,");
    const body = request(text);
    body.columns.push("slug");
    body.rows[0].push("bank-sitz");
    body.rows[1].push("bank-geld");
    const preview = await previewVocabularyImport(a, body);
    expect(preview.totals).toEqual({ total: 2, valid: 1, warnings: 1, errors: 0 });
    expect(byRow(preview)[3].warnings).toEqual(["Same word as row 2 (die Bank). Keep both only if they are different meanings."]);
    const result = await importVocabulary(a, body);
    expect(result.imported).toHaveLength(2);
    expect(result.totals.warnings).toBe(1);

    // Different articles are different words (der See / die See), not duplicates.
    const see = await previewVocabularyImport(a, request(csv("See,der,die Seen,noun,lake,,,", "See,die,,noun,sea,,,")));
    expect(byRow(see)[3].warnings).toEqual([]);
    expect(byRow(see)[3].errors).toEqual(['Slug "see" (A1) is also used by row 2. Give one of the rows its own slug.']);
  });

  it("checks against the library: an existing slug is an error, an existing word a warning", async () => {
    const a = await admin();
    await importVocabulary(a, request(csv("Haus,das,die Häuser,noun,house,,,", "Bank,die,die Bänke,noun,bench,,,")));
    await content.setPublishStatus(a, "vocabulary", { id: String((await (await vocab()).findOne({ slug: "bank" }))._id), to: "archived" });

    const body = request(csv("Haus,das,die Häuser,noun,home,,,", "Bank,die,die Banken,noun,bank,,,", "BANK,die,,noun,money bank,,B1,"));
    const rows = byRow(await previewVocabularyImport(a, body));
    expect(rows[2].errors).toEqual(['A word with slug "haus" already exists in A1 (das Haus). Give this row its own slug.']);
    // The existing word with the same slug isn't reported a second time as "same word".
    expect(rows[2].warnings).toEqual([]);
    expect(rows[3].errors).toEqual(['A word with slug "bank" already exists in A1 (die Bank, archived). Give this row its own slug.']);
    expect(rows[4].status).toBe("valid");

    body.columns.push("slug");
    body.rows.forEach((r, i) => r.push(`neu-${i}`));
    const rows2 = byRow(await previewVocabularyImport(a, body));
    expect(rows2[2]).toMatchObject({ status: "warning", errors: [] });
    expect(rows2[2].warnings).toEqual(['das Haus is already in the A1 library (slug "haus", meaning "house"). Keep it only if this is a different meaning.']);
    expect(rows2[3].warnings[0]).toMatch(/^die Bank is already in the A1 library \(slug "bank"/);
    expect(rows2[4].status).toBe("valid"); // B1 has no Bank
  });

  it("a slug taken while importing fails that row only and is reported", async () => {
    const a = await admin();
    await importVocabulary(a, request(csv("Haus,das,die Häuser,noun,house,,,")));
    // Simulate the race: the checks don't see the word that exists by the time of the insert.
    vi.spyOn(vocabularyRepository, "findByLevelSlugs").mockResolvedValue([]);
    const result = await importVocabulary(a, request(csv("Tisch,der,die Tische,noun,table,,,", "Haus,das,die Häuser,noun,home,,,", "Stuhl,der,die Stühle,noun,chair,,,")));
    expect(result.imported.map((r) => r.row)).toEqual([2, 4]);
    expect(result.failed).toEqual([{ row: 3, message: 'A word with slug "haus" was added to A1 while importing. Give this row its own slug.' }]);
    const col = await vocab();
    expect(await col.countDocuments()).toBe(3);
    expect((await col.findOne({ slug: "haus" })).meanings.en).toBe("house");
    for (const r of result.imported) expect(await col.findOne({ _id: new (await import("mongodb")).ObjectId(r.id) })).not.toBeNull();
  });

  it("insertMany reports exactly which documents were stored", async () => {
    const doc = (slug) => ({ levelCode: "A1", slug, lemma: slug, ...initialLifecycle({ sourceType: "original" }) });
    const out = await vocabularyRepository.insertMany([doc("a"), doc("b"), doc("a"), doc("c")]);
    expect(out.inserted.map((i) => i.index)).toEqual([0, 1, 3]);
    expect(out.failed).toEqual([{ index: 2, duplicate: true }]);
    expect(out.error).toBeNull();
    expect(await (await vocab()).countDocuments()).toBe(3);
  });
});

describe("failures and large imports", () => {
  it("a database failure stops the import and reports every row that wasn't stored", async () => {
    const a = await admin();
    const lines = Array.from({ length: IMPORT_LIMITS.insertChunk + 20 }, (_, i) => `Wort${i},,,verb,word ${i},,,`);
    const real = vocabularyRepository.insertMany;
    let call = 0;
    vi.spyOn(vocabularyRepository, "insertMany").mockImplementation(async (docs) => {
      call++;
      if (call === 1) return real(docs);
      return { inserted: [], failed: docs.map((_, index) => ({ index, duplicate: false })), error: new Error("connection reset") };
    });
    const result = await importVocabulary(a, request(csv(...lines)));
    expect(result.imported).toHaveLength(IMPORT_LIMITS.insertChunk);
    expect(result.failed).toHaveLength(20);
    expect(result.failed[0]).toEqual({ row: IMPORT_LIMITS.insertChunk + 2, message: "This row could not be saved. Try importing it again." });
    expect(await (await vocab()).countDocuments()).toBe(IMPORT_LIMITS.insertChunk);
  });

  it(`imports ${IMPORT_LIMITS.maxRows} rows in one request with a bounded number of queries`, async () => {
    const a = await admin();
    const lines = Array.from({ length: IMPORT_LIMITS.maxRows }, (_, i) => `Wort${i},das,die Wörter,noun,word ${i},Das ist Wort ${i}.,,`);
    const body = request(csv(...lines));
    const slugLookups = vi.spyOn(vocabularyRepository, "findByLevelSlugs");
    const lemmaLookups = vi.spyOn(vocabularyRepository, "findByLemmas");
    const inserts = vi.spyOn(vocabularyRepository, "insertMany");
    const started = Date.now();
    const result = await importVocabulary(a, body);
    expect(result.imported).toHaveLength(IMPORT_LIMITS.maxRows);
    expect(result.failed).toEqual([]);
    expect(slugLookups).toHaveBeenCalledTimes(1);
    expect(lemmaLookups).toHaveBeenCalledTimes(1);
    expect(inserts).toHaveBeenCalledTimes(Math.ceil(IMPORT_LIMITS.maxRows / IMPORT_LIMITS.insertChunk));
    expect(await (await vocab()).countDocuments()).toBe(IMPORT_LIMITS.maxRows);
    expect(Date.now() - started).toBeLessThan(15_000);

    // Importing the same data again: every row is an existing slug.
    const again = await previewVocabularyImport(a, body);
    expect(again.totals.errors).toBe(IMPORT_LIMITS.maxRows);
  }, 60_000);
});

describe("route handler", () => {
  const url = (mode = "preview") => `http://localhost:3000/api/admin/vocabulary/import?mode=${mode}`;
  const post = (user, body, { mode, headers = {} } = {}) =>
    handleVocabularyImport(
      new Request(url(mode), {
        method: "POST",
        headers: { origin: "http://localhost:3000", "content-type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
      { getUser: async () => user },
    );

  it("previews and imports for admins", async () => {
    const a = await admin();
    const body = request(csv("Haus,das,die Häuser,noun,house,,,"));
    const preview = await post(a, body);
    expect(preview.status).toBe(200);
    expect(preview.headers.get("cache-control")).toBe("no-store");
    expect((await preview.json()).data.totals).toEqual({ total: 1, valid: 1, warnings: 0, errors: 0 });
    const commit = await post(a, body, { mode: "commit" });
    expect(commit.status).toBe(200);
    expect((await commit.json()).data.imported).toHaveLength(1);
    const blocked = await post(a, body, { mode: "commit" });
    expect(blocked.status).toBe(400);
    expect(await blocked.json()).toMatchObject({ ok: false, code: "VALIDATION", fieldErrors: { "row.2": [expect.stringMatching(/already exists/)] } });
  });

  it("rejects cross-site, anonymous, non-admin, malformed and oversized requests", async () => {
    const a = await admin();
    const user = await createTestUser();
    const body = request(csv("Haus,das,die Häuser,noun,house,,,"));
    expect((await post(a, body, { headers: { origin: "https://evil.example" } })).status).toBe(403);
    expect((await post(a, body, { headers: { "sec-fetch-site": "cross-site" } })).status).toBe(403);
    expect((await post(null, body)).status).toBe(401);
    expect((await post(user, body)).status).toBe(403);
    expect((await post(a, body, { mode: "delete" })).status).toBe(400);
    expect((await post(a, body, { headers: { "content-type": "text/plain" } })).status).toBe(400);
    expect((await post(a, "{not json")).status).toBe(400);
    const big = await post(a, JSON.stringify({ ...body, pad: "x".repeat(IMPORT_LIMITS.maxBytes) }));
    expect(big.status).toBe(413);
    expect(await big.json()).toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(await (await vocab()).countDocuments()).toBe(0);
  });

  it("is rate limited per admin", async () => {
    const a = await admin();
    const { prefix, limit, windowMs } = RATE_LIMITS.vocabularyImportByUser;
    for (let i = 0; i < limit; i++) await incrementWindow(`${prefix}:${a.id}`, windowMs);
    const res = await post(a, request(csv("Haus,das,die Häuser,noun,house,,,")));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
