import { describe, expect, it } from "vitest";
import { detectDelimiter, formatDelimited, parseDelimited } from "@/lib/content/csv";
import { IMPORT_COLUMN_KEYS, IMPORT_LIMITS, readImportSource, resolveColumns, rowToVocabularyInput, templateRows } from "@/lib/content/vocabularyImport";
import { vocabularySchema } from "@/lib/validation/content";
import * as Shared from "@/lib/content/payload";
import * as Editor from "@/components/admin/editor/payload";

const cells = (text, opts) => parseDelimited(text, opts).records.map((r) => r.cells);

describe("CSV parser", () => {
  it("parses plain CSV with LF and CRLF line ends", () => {
    expect(cells("a,b,c\n1,2,3\n")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
    expect(cells("a,b\r\n1,2\r\n3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
    expect(cells("a,b\r1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("handles quoted fields, commas, escaped quotes and line breaks inside quotes", () => {
    const { records, errors } = parseDelimited('lemma,note\n"Haus, das","Er sagt ""Hallo"""\n"zwei\r\nZeilen",x\nletzte,"y"');
    expect(errors).toEqual([]);
    expect(records.map((r) => r.cells)).toEqual([
      ["lemma", "note"],
      ["Haus, das", 'Er sagt "Hallo"'],
      ["zwei\r\nZeilen", "x"],
      ["letzte", "y"],
    ]);
    // A multi-line cell stays one spreadsheet row, so later rows keep their numbers.
    expect(records.map((r) => r.row)).toEqual([1, 2, 3, 4]);
  });

  it("keeps German characters (UTF-8) and removes a byte order mark", () => {
    const { records } = parseDelimited("﻿lemma,plural\nStraße,die Straßen\nÄrztin,die Ärztinnen\nÖl,\nÜbung,die Übungen\n");
    expect(records[0].cells[0]).toBe("lemma");
    expect(records.slice(1).map((r) => r.cells)).toEqual([
      ["Straße", "die Straßen"],
      ["Ärztin", "die Ärztinnen"],
      ["Öl", ""],
      ["Übung", "die Übungen"],
    ]);
  });

  it("keeps empty optional values and skips empty lines without renumbering", () => {
    const { records } = parseDelimited("a,b,c\n1,,3\n\n,,\n4,5,\n");
    expect(records.map((r) => [r.row, r.cells])).toEqual([
      [1, ["a", "b", "c"]],
      [2, ["1", "", "3"]],
      [5, ["4", "5", ""]],
    ]);
  });

  it("detects tab (spreadsheet paste), semicolon (German Excel) and comma", () => {
    expect(detectDelimiter("Haus\thouse\tdas\n")).toBe("\t");
    expect(detectDelimiter("lemma;meaning_en\nHaus;house")).toBe(";");
    expect(detectDelimiter("lemma,meaning_en;x,y")).toBe(",");
    expect(detectDelimiter('"a;b;c",d\n')).toBe(",");
    expect(cells("Haus\thouse\tdas\tHäuser\tnoun\tA1\ngehen\tto go\t\t\tverb\tA1")).toEqual([
      ["Haus", "house", "das", "Häuser", "noun", "A1"],
      ["gehen", "to go", "", "", "verb", "A1"],
    ]);
    expect(cells('lemma;meaning_en\n"Haus; groß";house')).toEqual([["lemma", "meaning_en"], ["Haus; groß", "house"]]);
  });

  it("keeps quotes inside unquoted fields as text", () => {
    expect(cells('5" Rohr,x')).toEqual([['5" Rohr', "x"]]);
  });

  it("reports malformed CSV instead of guessing", () => {
    const open = parseDelimited('a,b\n1,"never closed\n2,3');
    expect(open.errors).toEqual([{ row: 2, message: expect.stringMatching(/not closed/) }]);
    const trailing = parseDelimited('a,b\n"x"y,1\n2,3');
    expect(trailing.errors).toEqual([{ row: 2, message: expect.stringMatching(/after a closing double quote/) }]);
    expect(trailing.records.map((r) => r.cells)).toEqual([["a", "b"], ["2", "3"]]);
  });

  it("formats CSV that parses back to the same cells", () => {
    const rows = [["lemma", "note"], ["Haus, das", 'Er sagt "Hallo"'], ["zwei\nZeilen", " leading"], ["Straße", ""]];
    const text = formatDelimited(rows);
    expect(text.startsWith("﻿")).toBe(true);
    expect(cells(text)).toEqual(rows);
  });
});

describe("import columns", () => {
  it("reads a header row with aliases, in any order and case", () => {
    const r = resolveColumns(["Word", "Translation", "part of speech", " Article ", "LEVEL", "meaning-bn", "source_type"]);
    expect(r).toEqual({ hasHeader: true, errors: [], columns: ["lemma", "meaning_en", "pos", "article", "level", "meaning_bn", "sourceType"] });
  });

  it("rejects columns the vocabulary model doesn't have, and never imports a status", () => {
    const r = resolveColumns(["lemma", "meaning_en", "pos", "status", "pronunciation", "lemma"]);
    expect(r.errors).toEqual([
      expect.stringMatching(/"status" can't be imported\. New words are always imported as drafts/),
      expect.stringMatching(/"pronunciation" can't be imported\. Supported columns/),
      'Column "lemma" appears twice.',
    ]);
    expect(resolveColumns(["meaning_en", "pos"]).errors).toEqual([expect.stringMatching(/needs a "lemma"/)]);
  });

  it("uses the template column order when pasted data has no header", () => {
    const r = readImportSource("Haus\tdas\tdie Häuser\tnoun\thouse\ngehen\t\t\tverb\tto go");
    expect(r.hasHeader).toBe(false);
    expect(r.rows).toEqual([
      { row: 1, values: { lemma: "Haus", article: "das", plural: "die Häuser", pos: "noun", meaning_en: "house" } },
      { row: 2, values: { lemma: "gehen", pos: "verb", meaning_en: "to go" } },
    ]);
  });

  it("numbers rows as a spreadsheet does and reports unreadable rows", () => {
    const long = "x".repeat(IMPORT_LIMITS.maxCellLength + 1);
    const r = readImportSource(`lemma,meaning_en,pos\nHaus,house,noun\n${long},x,noun\nA,b,c,d\n"offen,x,noun\n`);
    expect(r.rows).toEqual([{ row: 2, values: { lemma: "Haus", meaning_en: "house", pos: "noun" } }]);
    expect(Object.keys(r.rowErrors)).toEqual(["3", "4", "5"]);
    expect(r.rowErrors[3][0]).toMatch(/longer than 2000/);
    expect(r.rowErrors[4][0]).toMatch(/4 cells but there are only 3 columns/);
    expect(r.rowErrors[5][0]).toMatch(/not closed/);
  });

  it("enforces the row and size limits", () => {
    const limits = { ...IMPORT_LIMITS, maxRows: 2, maxBytes: 200 };
    expect(readImportSource("lemma\na\nb\nc", { limits }).errors[0]).toMatch(/3 rows is more than the limit of 2/);
    expect(readImportSource("lemma\n" + "x".repeat(300), { limits }).errors[0]).toMatch(/larger than/);
    expect(readImportSource("  \n\n").errors).toEqual(["There is no data to import."]);
  });

  it("the template has every import column and its examples are valid words", () => {
    const [header, ...examples] = templateRows();
    expect(header).toEqual(IMPORT_COLUMN_KEYS);
    const { rows } = readImportSource(formatDelimited(templateRows()));
    expect(rows).toHaveLength(examples.length);
    for (const r of rows) {
      expect(vocabularySchema.safeParse(rowToVocabularyInput(r.values, { sourceType: "original" })).success).toBe(true);
    }
  });
});

describe("row → vocabulary payload", () => {
  it("builds the payload the word editor sends", () => {
    const input = rowToVocabularyInput(
      {
        lemma: "Straße",
        article: "Die",
        plural: "die Straßen",
        pos: "Noun",
        meaning_en: "street",
        meaning_bn: "রাস্তা",
        example_de: "Die Straße ist lang.",
        example_en: "The street is long.",
        notes_en: "Also: road",
        level: "a1",
        topics: "stadt, verkehr",
        tags: "a1-core",
      },
      { levelCode: "A2", sourceType: "original" },
    );
    expect(input).toEqual({
      levelCode: "A1",
      slug: "strasse",
      lemma: "Straße",
      article: "die",
      plural: "die Straßen",
      pos: "noun",
      meanings: { en: "street", bn: "রাস্তা" },
      example: { de: "Die Straße ist lang.", en: "The street is long." },
      notes: { en: "Also: road" },
      topics: ["stadt", "verkehr"],
      tags: ["a1-core"],
      refs: [],
      sourceType: "original",
    });
  });

  it("uses the editor's own payload builder, so a row and an edited word match exactly", () => {
    expect(Editor.vocabularyPayload).toBe(Shared.vocabularyPayload);
    expect(Editor.slugify).toBe(Shared.slugify);
    // The word editor: a new word's state, filled in, slug made from the lemma.
    const state = {
      ...Editor.vocabularyState(null, { levelCode: "A1" }),
      lemma: "Straße",
      article: "die",
      plural: "die Straßen",
      meanings: { de: "", en: "street", bn: "রাস্তা" },
      example: { de: "Die Straße ist lang.", en: "The street is long.", bn: "" },
      topics: "stadt, verkehr",
      tags: "a1-core",
    };
    const fromEditor = Editor.vocabularyPayload({ ...state, slug: Editor.slugify(state.lemma) });
    const fromRow = rowToVocabularyInput(
      {
        lemma: "Straße",
        article: "die",
        plural: "die Straßen",
        pos: "noun",
        meaning_en: "street",
        meaning_bn: "রাস্তা",
        example_de: "Die Straße ist lang.",
        example_en: "The street is long.",
        level: "A1",
        topics: "stadt, verkehr",
        tags: "a1-core",
      },
      { sourceType: "original" },
    );
    expect(fromRow).toEqual(fromEditor);
  });

  it("uses the page defaults only where the row has no value", () => {
    const d = { levelCode: "A2", sourceType: "licensed", sourceReference: "Book X" };
    expect(rowToVocabularyInput({ lemma: "gehen", pos: "verb", meaning_en: "to go" }, d)).toMatchObject({
      levelCode: "A2",
      slug: "gehen",
      article: null,
      plural: null,
      sourceType: "licensed",
      sourceReference: "Book X",
    });
    // A row with its own source type doesn't inherit the default's reference.
    const own = rowToVocabularyInput({ lemma: "gehen", pos: "verb", meaning_en: "to go", sourceType: "original" }, d);
    expect(own.sourceType).toBe("original");
    expect(own).not.toHaveProperty("sourceReference");
    expect(rowToVocabularyInput({ lemma: "gehen", pos: "proper noun", meaning_en: "x", slug: "eigener-slug" }, {})).toMatchObject({
      pos: "proper_noun",
      slug: "eigener-slug",
    });
    expect(rowToVocabularyInput({ lemma: "gehen" }, {})).not.toHaveProperty("levelCode");
  });
});
