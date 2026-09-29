import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { publishLevel } from "@/tests/helpers/curriculum";
import * as content from "@/lib/services/contentService";
import * as curriculum from "@/lib/services/curriculumService";
import { seedLevels } from "@/lib/services/seedService";
import { LEVELS } from "@/content/seed/levels";
import { ROLES } from "@/lib/auth/roles";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";

// CMS Phase 1: admin content authoring through contentService.saveContent, the entry
// point used by saveContentAction. Everything else (lifecycle, publishing) goes through
// the existing service functions.

setupTestDatabase();

const admin = () => createTestUser({ role: ROLES.ADMIN });
const save = (actor, kind, data, { id, version } = {}) => content.saveContent(actor, { kind, id, version, data });
const publish = async (actor, kind, id) => {
  await content.transitionReview(actor, kind, { id, to: "reviewed" });
  await content.transitionReview(actor, kind, { id, to: "approved" });
  return content.setPublishStatus(actor, kind, { id, to: "published" });
};

const moduleData = (over = {}) => ({ levelCode: "A1", slug: "cms-modul", order: 5, title: { de: "CMS-Modul", en: "CMS module" }, sourceType: "original", ...over });
const wordData = (over = {}) => ({
  levelCode: "A1",
  slug: "haus",
  lemma: "Haus",
  article: "das",
  plural: "die Häuser",
  pos: "noun",
  meanings: { en: "house" },
  example: { de: "Das Haus ist groß." },
  topics: ["wohnen"],
  sourceType: "original",
  ...over,
});
const grammarData = (over = {}) => ({
  levelCode: "A1",
  slug: "artikel",
  title: { de: "Der, die, das" },
  summary: { en: "Articles" },
  sections: [
    { heading: { en: "Gender" }, body: { en: "Every noun has a gender." }, examples: [{ de: "der Tisch" }] },
    { heading: { en: "Table" }, table: { headers: ["m", "f", "n"], rows: [["der", "die", "das"]] } },
  ],
  sourceType: "original",
  ...over,
});
const mcq = { type: "mcq", id: "q1", prompt: { de: "Was ist das?" }, options: [{ id: "a", text: { de: "ein Haus" } }, { id: "b", text: { de: "ein Hund" } }], answer: "a" };
const exerciseData = (over = {}) => ({
  levelCode: "A1",
  slug: "haus-quiz",
  skill: "vocabulary",
  title: { de: "Wörter: Haus" },
  instructions: { en: "Choose." },
  items: [mcq],
  passThreshold: 0.5,
  sourceType: "original",
  ...over,
});

// A module with one lesson composed from new library items, all created through the CMS.
async function composeLesson(actor) {
  const mod = await save(actor, "modules", moduleData());
  const word = await save(actor, "vocabulary", wordData());
  const word2 = await save(actor, "vocabulary", wordData({ slug: "tisch", lemma: "Tisch", article: "der", plural: "die Tische", example: undefined }));
  const topic = await save(actor, "grammarTopics", grammarData());
  const ex = await save(actor, "exercises", exerciseData());
  const lesson = await save(actor, "lessons", {
    moduleId: mod.id,
    slug: "zu-hause",
    order: 1,
    estimatedMinutes: 15,
    title: { de: "Zu Hause" },
    blocks: [
      { type: "intro", key: "intro", body: { en: "Welcome" } },
      { type: "vocabulary", key: "woerter", vocabIds: [word.id, word2.id] },
      { type: "grammar", key: "artikel", refId: topic.id },
      { type: "practice", key: "quiz", refId: ex.id },
    ],
    sourceType: "original",
  });
  return { mod, word, word2, topic, ex, lesson };
}

describe("CMS authorisation", () => {
  it("non-admins cannot create, update or read drafts through any CMS entry point", async () => {
    const user = await createTestUser();
    const a = await admin();
    const word = await save(a, "vocabulary", wordData());

    await expect(save(user, "vocabulary", wordData({ slug: "x" }))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(save(user, "vocabulary", wordData(), { id: word.id, version: 1 })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(save(null, "vocabulary", wordData({ slug: "y" }))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.getContentForAdmin(user, "vocabulary", word.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.searchContentOptions(user, "vocabulary", {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.listEditorOptions(user)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.getAdminOverview(user)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.listContentForAdmin(user, "vocabulary", { q: "Haus" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.setPublishStatus(user, "vocabulary", { id: word.id, to: "archived" })).rejects.toBeInstanceOf(ForbiddenError);

    const db = await getDb();
    expect(await db.collection("vocabulary").countDocuments()).toBe(1);
    expect((await db.collection("vocabulary").findOne({})).version).toBe(1);
  });

  it("only editable content types are accepted", async () => {
    const a = await admin();
    await expect(save(a, "users", { email: "x@example.de" })).rejects.toBeInstanceOf(ValidationError);
    await expect(save(a, "references", { slug: "x", kind: "book", title: "X", sourceType: "original" })).rejects.toBeInstanceOf(ValidationError);
    await expect(content.searchContentOptions(a, "users", {})).rejects.toBeInstanceOf(ValidationError);
  });

  it("client-supplied lifecycle and audit fields are ignored", async () => {
    const a = await admin();
    const forged = {
      reviewStatus: "approved",
      publishStatus: "published",
      approvalBasis: "human_review",
      approvedBy: a.id,
      version: 99,
      createdBy: new ObjectId().toHexString(),
    };
    const word = await save(a, "vocabulary", { ...wordData(), ...forged });
    expect(word).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", approvalBasis: null, approvedBy: null, version: 1, createdBy: a.id });

    const updated = await save(a, "vocabulary", { ...wordData({ plural: null }), ...forged }, { id: word.id, version: 1 });
    expect(updated).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", version: 2, plural: null });
  });
});

describe("CMS validation and concurrency", () => {
  it("rejects invalid data with field errors", async () => {
    const a = await admin();
    const noArticle = await save(a, "vocabulary", wordData({ article: null })).catch((e) => e);
    expect(noArticle).toBeInstanceOf(ValidationError);
    expect(noArticle.fieldErrors).toHaveProperty("article");

    const badAnswer = await save(a, "exercises", exerciseData({ items: [{ ...mcq, answer: "z" }] })).catch((e) => e);
    expect(badAnswer.fieldErrors).toHaveProperty(["items.0.answer"]);

    const noTitle = await save(a, "modules", moduleData({ title: { en: "Only English" } })).catch((e) => e);
    expect(noTitle.fieldErrors).toHaveProperty(["title.de"]);

    const badSlug = await save(a, "grammarTopics", grammarData({ slug: "Der Artikel" })).catch((e) => e);
    expect(badSlug.fieldErrors).toHaveProperty("slug");
  });

  it("stale or missing versions are rejected", async () => {
    const a = await admin();
    const word = await save(a, "vocabulary", wordData());
    await save(a, "vocabulary", wordData({ meanings: { en: "house, home" } }), { id: word.id, version: 1 });
    await expect(save(a, "vocabulary", wordData({ meanings: { en: "building" } }), { id: word.id, version: 1 })).rejects.toBeInstanceOf(ConflictError);
    await expect(content.saveContent(a, { kind: "vocabulary", id: word.id, data: wordData() })).rejects.toBeInstanceOf(ValidationError);
    await expect(save(a, "vocabulary", wordData(), { id: new ObjectId().toHexString(), version: 1 })).rejects.toBeInstanceOf(NotFoundError);
    const stored = await content.getContentForAdmin(a, "vocabulary", word.id);
    expect(stored.item).toMatchObject({ version: 2, meanings: { en: "house, home" } });
  });

  it("duplicate slugs are conflicts", async () => {
    const a = await admin();
    await save(a, "vocabulary", wordData());
    await expect(save(a, "vocabulary", wordData({ lemma: "Häuschen" }))).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("levels and modules", () => {
  it("creates and edits a level; its code can't change", async () => {
    const a = await admin();
    const level = await save(a, "levels", {
      code: "B1",
      order: 3,
      title: { de: "B1" },
      mastery: { skills: { reading: { threshold: 0.7, required: true } } },
      sourceType: "system",
    });
    const edited = await save(
      a,
      "levels",
      { code: "B1", order: 3, title: { de: "B1 – Mittelstufe" }, mastery: { skills: { reading: { threshold: 0.8, required: false } } }, sourceType: "system" },
      { id: level.id, version: 1 },
    );
    expect(edited.mastery.skills.reading).toEqual({ threshold: 0.8, required: false });
    const renamed = await save(a, "levels", { code: "B2", order: 3, title: { de: "B2" }, sourceType: "system" }, { id: level.id, version: 2 }).catch((e) => e);
    expect(renamed).toBeInstanceOf(ValidationError);
    expect(renamed.fieldErrors).toHaveProperty("code");
  });

  it("module fields round-trip, removed optional fields are cleared, lists filter by level", async () => {
    const a = await admin();
    const mod = await save(a, "modules", moduleData({ description: { en: "About" }, goals: [{ en: "Say hello" }], mastery: { skills: { speaking: null } } }));
    expect(mod.mastery).toEqual({ skills: { speaking: null } });
    const edited = await save(a, "modules", moduleData({ goals: [] }), { id: mod.id, version: 1 });
    expect(edited.description).toBeNull();
    expect(edited.mastery).toBeNull();
    expect(edited.goals).toEqual([]);

    await save(a, "modules", moduleData({ levelCode: "A2", slug: "a2-modul" }));
    const a1 = await content.listContentForAdmin(a, "modules", { level: "A1" });
    expect(a1.items.map((m) => m.slug)).toEqual(["cms-modul"]);
    expect((await content.listContentForAdmin(a, "modules", { level: "Z9" })).total).toBe(2); // invalid filters are ignored
  });
});

describe("lessons and the block composer", () => {
  it("stores block references as ids of the right collections", async () => {
    const a = await admin();
    const { lesson, word, word2, topic, ex, mod } = await composeLesson(a);
    expect(lesson.moduleId).toBe(mod.id);
    expect(lesson.blocks.map((b) => b.key)).toEqual(["intro", "woerter", "artikel", "quiz"]);
    const db = await getDb();
    const raw = await db.collection("lessons").findOne({ _id: new ObjectId(lesson.id) });
    expect(raw.moduleId).toBeInstanceOf(ObjectId);
    expect(raw.blocks[1].vocabIds.map(String)).toEqual([word.id, word2.id]);
    expect(raw.blocks[2].refId).toBeInstanceOf(ObjectId);
    expect(String(raw.blocks[2].refId)).toBe(topic.id);
    expect(String(raw.blocks[3].refId)).toBe(ex.id);

    const view = await content.getContentForAdmin(a, "lessons", lesson.id);
    expect(Object.keys(view.related).sort()).toEqual([word.id, word2.id, topic.id, ex.id].sort());
    expect(view.related[word.id]).toMatchObject({ kind: "vocabulary", label: "das Haus", reviewStatus: "draft" });

    const usage = await content.getContentForAdmin(a, "vocabulary", word.id);
    expect(usage.usedBy.map((l) => l.id)).toEqual([lesson.id]);
  });

  it("reordering and removing blocks keeps the stable keys", async () => {
    const a = await admin();
    const { lesson } = await composeLesson(a);
    const reordered = [lesson.blocks[3], lesson.blocks[0], lesson.blocks[1]];
    const saved = await save(a, "lessons", { ...lessonInput(lesson), blocks: reordered }, { id: lesson.id, version: 1 });
    expect(saved.blocks.map((b) => b.key)).toEqual(["quiz", "intro", "woerter"]);
    expect(saved.version).toBe(2);
  });

  it("rejects missing modules, missing items, wrong collections and duplicate words", async () => {
    const a = await admin();
    const { lesson, ex, topic, word } = await composeLesson(a);
    const base = lessonInput(lesson);

    const noModule = await save(a, "lessons", { ...base, slug: "x", moduleId: new ObjectId().toHexString() }).catch((e) => e);
    expect(noModule.fieldErrors).toHaveProperty("moduleId");

    const wrongKind = await save(a, "lessons", { ...base, slug: "y", blocks: [{ type: "grammar", key: "g", refId: ex.id }] }).catch((e) => e);
    expect(wrongKind.fieldErrors).toHaveProperty(["blocks.0.refId"]);

    const wrongKind2 = await save(a, "lessons", { ...base, slug: "z", blocks: [{ type: "reading", key: "r", refId: topic.id }] }).catch((e) => e);
    expect(wrongKind2.fieldErrors).toHaveProperty(["blocks.0.refId"]);

    const dupWords = await save(a, "lessons", { ...base, slug: "w", blocks: [{ type: "vocabulary", key: "v", vocabIds: [word.id, word.id] }] }).catch((e) => e);
    expect(dupWords.fieldErrors["blocks.0.vocabIds"]).toEqual(["A word appears twice in this block"]);

    const dupKeys = await save(a, "lessons", { ...base, slug: "k", blocks: [{ type: "intro", key: "a", body: { en: "1" } }, { type: "intro", key: "a", body: { en: "2" } }] }).catch((e) => e);
    expect(dupKeys).toBeInstanceOf(ValidationError);

    const db = await getDb();
    expect(await db.collection("lessons").countDocuments()).toBe(1);
  });

  it("lists lessons by module and by level", async () => {
    const a = await admin();
    const { mod, lesson } = await composeLesson(a);
    expect((await content.listContentForAdmin(a, "lessons", { moduleId: mod.id })).items.map((l) => l.id)).toEqual([lesson.id]);
    expect((await content.listContentForAdmin(a, "lessons", { level: "A1" })).total).toBe(1);
    expect((await content.listContentForAdmin(a, "lessons", { level: "B1" })).total).toBe(0);
  });
});

function lessonInput(lesson) {
  return {
    moduleId: lesson.moduleId,
    slug: lesson.slug,
    order: lesson.order,
    title: lesson.title,
    blocks: lesson.blocks,
    sourceType: lesson.sourceType,
  };
}

describe("vocabulary library", () => {
  it("create, edit, search, filter, paginate, archive and restore", async () => {
    const a = await admin();
    const haus = await save(a, "vocabulary", wordData());
    await save(a, "vocabulary", wordData({ slug: "wohnung", lemma: "Wohnung", article: "die", plural: "die Wohnungen", topics: ["wohnen"] }));
    await save(a, "vocabulary", wordData({ slug: "hallo", lemma: "hallo", article: null, plural: null, pos: "interjection", meanings: { en: "hello" }, topics: ["begruessung"] }));
    await save(a, "vocabulary", wordData({ levelCode: "A2", slug: "miete", lemma: "Miete", article: "die", plural: null, meanings: { en: "rent" }, topics: ["wohnen"] }));

    const edited = await save(a, "vocabulary", wordData({ notes: { en: "Neuter" }, example: undefined }), { id: haus.id, version: 1 });
    expect(edited.notes).toEqual({ en: "Neuter" });
    expect(edited.example).toBeNull();

    const search = (q) => content.listContentForAdmin(a, "vocabulary", q).then((r) => r.items.map((v) => v.slug).sort());
    expect(await search({ q: "haus" })).toEqual(["haus"]);
    expect(await search({ q: "HELLO" })).toEqual(["hallo"]); // meanings, case-insensitive
    expect(await search({ q: "Häuser" })).toEqual(["haus"]); // plural
    expect(await search({ q: ".*(" })).toEqual([]); // regex characters are literal
    expect(await search({ topic: "wohnen" })).toEqual(["haus", "miete", "wohnung"]);
    expect(await search({ topic: "wohnen", level: "A1" })).toEqual(["haus", "wohnung"]);
    expect(await search({ pos: "interjection" })).toEqual(["hallo"]);

    const page1 = await content.listContentForAdmin(a, "vocabulary", { pageSize: "3" });
    const page2 = await content.listContentForAdmin(a, "vocabulary", { pageSize: "3", page: "2" });
    expect([page1.items.length, page2.items.length, page1.total]).toEqual([3, 1, 4]);
    expect(new Set([...page1.items, ...page2.items].map((v) => v.id)).size).toBe(4);

    await content.setPublishStatus(a, "vocabulary", { id: haus.id, to: "archived" });
    expect(await search({})).toEqual(["hallo", "miete", "wohnung"]);
    expect(await search({ publish: "archived" })).toEqual(["haus"]);
    expect((await content.searchContentOptions(a, "vocabulary", { q: "haus" })).items).toEqual([]);
    const restored = await content.setPublishStatus(a, "vocabulary", { id: haus.id, to: "unpublished" });
    expect(restored.publishStatus).toBe("unpublished");
    expect((await content.searchContentOptions(a, "vocabulary", { q: "haus" })).items.map((o) => o.label)).toEqual(["das Haus"]);
  });
});

describe("grammar topics", () => {
  it("create, edit sections (add, remove, reorder), clear the summary", async () => {
    const a = await admin();
    const g = await save(a, "grammarTopics", grammarData());
    expect(g.sections).toHaveLength(2);
    const [s1, s2] = g.sections;
    const s3 = { heading: { en: "More" }, examples: [{ de: "die Lampe", en: "the lamp" }] };
    const edited = await save(a, "grammarTopics", grammarData({ summary: undefined, sections: [s2, s3] }), { id: g.id, version: 1 });
    expect(edited.summary).toBeNull();
    expect(edited.sections.map((s) => s.heading.en)).toEqual(["Table", "More"]);
    expect(edited.sections[0].table).toEqual(s2.table);
    expect(edited.sections).not.toContainEqual(expect.objectContaining({ heading: s1.heading }));

    const noSections = await save(a, "grammarTopics", grammarData({ sections: [] }), { id: g.id, version: 2 }).catch((e) => e);
    expect(noSections.fieldErrors).toHaveProperty("sections");
    const exampleWithoutGerman = await save(a, "grammarTopics", grammarData({ sections: [{ examples: [{ en: "only English" }] }] }), { id: g.id, version: 2 }).catch((e) => e);
    expect(exampleWithoutGerman.fieldErrors).toHaveProperty(["sections.0.examples.0.de"]);
  });
});

describe("exercises", () => {
  const allTypes = [
    mcq,
    { type: "true_false", id: "q2", statement: { de: "Das Haus ist klein." }, answer: false },
    { type: "text_input", id: "q3", before: "Das ist", after: "Haus.", accepted: ["ein"], umlautTolerant: true },
    { type: "match", id: "q4", pairs: [{ id: "p1", left: { de: "das Haus" }, right: { en: "house" } }, { id: "p2", left: { de: "der Tisch" }, right: { en: "table" } }] },
    { type: "order", id: "q5", tokens: ["Das", "Haus", "ist", "groß", "."], alternatives: ["Groß ist das Haus."] },
    { type: "speak_prompt", id: "q6", cue: { de: "Haus?" }, modelAnswer: { de: "Mein Haus ist groß." } },
  ];

  it("create with every item type, then edit items, stimulus and threshold", async () => {
    const a = await admin();
    const ex = await save(a, "exercises", exerciseData({ items: allTypes, stimulus: { text: { de: "Das ist mein Haus." }, textKind: "message" } }));
    expect(ex.items.map((i) => i.type)).toEqual(["mcq", "true_false", "text_input", "match", "order", "speak_prompt"]);
    expect(ex.stimulus).toMatchObject({ text: { de: "Das ist mein Haus." }, transcriptPolicy: "after_submit", maxPlays: null });
    const view = await content.getContentForAdmin(a, "exercises", ex.id);
    expect(view.checks).toEqual({ maxScore: 6, missingAudio: 0, audio: { targets: [], source: "none", missing: 0 } }); // mcq, true_false, text_input, order: 1 each; match: 1 per pair; speaking ungraded

    const reordered = [allTypes[4], { ...allTypes[0], answer: "b" }];
    const edited = await save(a, "exercises", exerciseData({ items: reordered, passThreshold: 0.8 }), { id: ex.id, version: 1 });
    expect(edited.items.map((i) => i.id)).toEqual(["q5", "q1"]);
    expect(edited.items[1].answer).toBe("b");
    expect(edited.passThreshold).toBe(0.8);
    expect(edited.stimulus).toBeNull();
  });

  it("rejects invalid questions", async () => {
    const a = await admin();
    const fail = (data) => save(a, "exercises", exerciseData(data)).catch((e) => e.fieldErrors);
    expect(await fail({ items: [] })).toHaveProperty("items");
    expect(await fail({ items: [mcq, mcq] })).toHaveProperty("items");
    expect(await fail({ items: [{ ...allTypes[2], accepted: [] }] })).toHaveProperty(["items.0.accepted"]);
    expect(await fail({ items: [{ type: "essay", id: "q1" }] })).toHaveProperty(["items.0.type"]);
    expect(await fail({ skill: "listening" })).toHaveProperty("stimulus"); // listening needs audio
    expect(await fail({ passThreshold: 1.5 })).toHaveProperty("passThreshold");
  });

  it("publishing still enforces the existing readiness rules", async () => {
    const a = await admin();
    const listening = await save(a, "exercises", exerciseData({ slug: "hoeren", skill: "listening", stimulus: { audio: { lines: [{ text: "Hallo, ich bin Anna." }] } } }));
    await content.transitionReview(a, "exercises", { id: listening.id, to: "reviewed" });
    await content.transitionReview(a, "exercises", { id: listening.id, to: "approved" });
    await expect(content.setPublishStatus(a, "exercises", { id: listening.id, to: "published" })).rejects.toThrow(/audio/);
  });
});

describe("learner visibility of CMS content", () => {
  it("new content is invisible until the whole chain is published; edits and archiving hide it again", async () => {
    const a = await admin();
    const learner = await createTestUser();
    await seedLevels(LEVELS);
    const { mod, lesson, word, word2, topic, ex } = await composeLesson(a);
    const route = { level: "a1", module: mod.slug, lesson: lesson.slug };

    await expect(curriculum.getLearnerModule(learner, "a1", mod.slug)).rejects.toBeInstanceOf(NotFoundError);
    await expect(curriculum.getLearnerLesson(learner, route)).rejects.toBeInstanceOf(NotFoundError);

    // A lesson can't be published before its content.
    await content.transitionReview(a, "lessons", { id: lesson.id, to: "reviewed" });
    await content.transitionReview(a, "lessons", { id: lesson.id, to: "approved" });
    await expect(content.setPublishStatus(a, "lessons", { id: lesson.id, to: "published" })).rejects.toBeInstanceOf(ConflictError);

    for (const [kind, doc] of [["vocabulary", word], ["vocabulary", word2], ["grammarTopics", topic], ["exercises", ex], ["modules", mod]]) {
      await publish(a, kind, doc.id);
    }
    await content.setPublishStatus(a, "lessons", { id: lesson.id, to: "published" });
    await expect(curriculum.getLearnerLesson(learner, route)).rejects.toBeInstanceOf(NotFoundError); // level still unpublished
    await publishLevel(a);

    const visible = await curriculum.getLearnerLesson(learner, route);
    expect(visible.available).toBe(true);
    expect(visible.blocks.map((b) => b.key)).toEqual(["intro", "woerter", "artikel", "quiz"]);
    expect(visible.blocks[1].cards.map((c) => c.display)).toEqual(["das Haus", "der Tisch"]);
    expect(JSON.stringify(visible.blocks[3].exercise)).not.toContain('"answer"');

    // Editing a published word through the CMS returns it to draft and hides the lesson.
    const current = await content.getContentForAdmin(a, "vocabulary", word.id);
    const edited = await save(a, "vocabulary", wordData({ meanings: { en: "house, building" } }), { id: word.id, version: current.item.version });
    expect(edited).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished" });
    expect((await curriculum.getLearnerLesson(learner, route)).available).toBe(false);

    await publish(a, "vocabulary", word.id);
    expect((await curriculum.getLearnerLesson(learner, route)).available).toBe(true);

    // Archiving (soft delete) hides it too.
    await content.setPublishStatus(a, "grammarTopics", { id: topic.id, to: "archived" });
    expect((await curriculum.getLearnerLesson(learner, route)).available).toBe(false);
  });
});

describe("admin overview", () => {
  it("counts content by state", async () => {
    const a = await admin();
    await composeLesson(a);
    const overview = await content.getAdminOverview(a);
    expect(overview.vocabulary).toMatchObject({ total: 2, draft: 2, unpublished: 2, published: 0 });
    expect(overview.lessons.total).toBe(1);
    const options = await content.listEditorOptions(a);
    expect(options.modules.map((m) => m.label)).toEqual(["A1 · CMS-Modul"]);
  });
});
