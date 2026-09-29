import { test, expect } from "@playwright/test";
import { answer, login, register, ADMIN } from "./helpers.js";
import { makeMp3 } from "../helpers/mp3.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";

// CMS Phase 3 through the real UI against the production build: an admin composes a
// draft lesson (intro, words, grammar, a listening exercise with a native recording, a
// Module 1 listening exercise with generated TTS, speaking practice) and plays it with
// "Preview as learner". Nothing is uploaded or recorded for the viewer; learners can't
// open the preview or the draft. The lesson lives in a fresh draft module, so Module 1
// (and the specs that count its content) stays untouched. The database-level "zero writes" proof is in
// tests/integration/lesson-preview.test.js.

const suffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const exerciseBySlug = new Map(MODULE_1.exercises.map((e) => [e.slug, e]));
const NOT_FOUND_HEADING = "Seite nicht gefunden";

async function addBlock(page, type) {
  await page.getByLabel("New block type").selectOption(type);
  await page.getByRole("button", { name: "+ Add block" }).click();
  return page.getByTestId("lesson-block").last();
}

async function choose(block, pickerLabel, query, label) {
  const picker = block.getByRole("group", { name: pickerLabel });
  await picker.getByRole("searchbox").fill(query);
  await picker.getByRole("button", { name: `Choose ${label}` }).click();
}

test("admin previews a draft lesson as a learner, and nothing is saved", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "admin authoring runs on desktop only");
  test.setTimeout(120_000);
  const s = suffix();
  const title = `Vorschau ${s}`;
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  // A native recording (upload endpoint), attached to a new draft listening exercise.
  const upload = await page.request.post(`/api/admin/media?${new URLSearchParams({ filename: "dialog.mp3", title: `Aufnahme ${s}` })}`, {
    headers: { Origin: new URL(page.url()).origin, "Content-Type": "audio/mpeg" },
    data: Buffer.from(makeMp3({ seconds: 1.5 })),
  });
  expect(upload.status()).toBe(201);
  const mediaId = (await upload.json()).media.id;

  await page.goto("/admin/exercises/new?skill=listening");
  await page.getByLabel("Slug").fill(`vorschau-hoeren-${s}`);
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(`Hören ${s}`);
  await page.getByLabel("This exercise has a stimulus").check();
  await page.getByRole("button", { name: "+ Add line" }).click();
  await page.getByRole("textbox", { name: "Line 1", exact: true }).fill("Der Zug nach Berlin fährt um neun Uhr.");
  const passage = page.getByTestId("audio-attachment").first();
  await passage.getByRole("button", { name: "Attach a recording" }).click();
  await passage.getByLabel("Search recordings").fill(`Aufnahme ${s}`);
  await passage.getByRole("button", { name: `Use Aufnahme ${s}` }).click();
  await expect(passage.getByTestId("audio-source")).toHaveText("Native audio attached");
  await page.getByLabel("Question type").selectOption({ label: "Richtig / falsch" });
  await page.getByRole("group", { name: /^Statement/ }).getByLabel("Deutsch *").fill("Der Zug fährt um neun Uhr.");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/exercises\/[0-9a-f]{24}\?created=1$/);

  // A draft module and the draft lesson in it.
  const moduleTitle = `Vorschau-Modul ${s}`;
  await page.goto("/admin/modules/new");
  await page.getByLabel("Level").selectOption("A1");
  await page.getByLabel("Slug").fill(`vorschau-modul-${s}`);
  await page.getByLabel("Order").fill("90");
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(moduleTitle);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/modules\/[0-9a-f]{24}\/edit\?created=1$/);

  await page.goto("/admin/lessons/new");
  await page.getByLabel("Module").selectOption({ label: `A1 · ${moduleTitle}` });
  await page.getByLabel("Slug").fill(`vorschau-${s}`);
  await page.getByLabel("Order").fill("60");
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(title);
  const intro = await addBlock(page, "intro");
  await intro.getByRole("group", { name: /^Text/ }).getByLabel("English").fill("A lesson in preview.");
  const words = await addBlock(page, "vocabulary");
  const wordPicker = words.getByRole("group", { name: "Add words from the vocabulary library" });
  await wordPicker.getByRole("searchbox").fill("Guten Morgen");
  await wordPicker.getByRole("button", { name: "Add Guten Morgen!" }).click();
  await choose(await addBlock(page, "grammar"), "Choose a grammar topic", "du-und-sie", "du oder Sie?");
  await choose(await addBlock(page, "listening"), "Choose an exercise", `vorschau-hoeren-${s}`, `Hören ${s}`);
  await choose(await addBlock(page, "listening"), "Choose an exercise", "m1-begruessung-hoeren", "Guten Morgen, Frau Weber!");
  await choose(await addBlock(page, "speaking"), "Choose an exercise", "m1-vorstellen-sprechen", "Sich vorstellen");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/lessons\/[0-9a-f]{24}\?created=1$/);
  const lessonId = page.url().match(/lessons\/([0-9a-f]{24})/)[1];

  // Watch for anything that would store learner data from the browser.
  const uploads = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/recordings")) uploads.push(r.url());
  });

  await page.getByRole("link", { name: "Preview as learner" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/lessons/${lessonId}/preview\\?block=`));
  const banner = page.getByTestId("preview-banner");
  await expect(banner).toContainText("Draft preview");
  await expect(banner).toContainText("Nothing you do here is saved");
  await expect(banner.getByText("draft", { exact: true })).toBeVisible();
  await expect(banner.getByText("unpublished", { exact: true })).toBeVisible();
  await expect(banner).toContainText("module not published");
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();

  // Steps in composer order.
  const steps = page.getByRole("navigation", { name: "Lesson steps" }).getByRole("listitem");
  const labels = ["Introduction", "Words", "Grammar", "Listening", "Listening", "Speaking"];
  await expect(steps).toHaveCount(labels.length);
  for (const [i, label] of labels.entries()) await expect(steps.nth(i)).toContainText(label);

  // Intro, words (rated in the browser only) and grammar move on without saving.
  await expect(page.getByText("A lesson in preview.")).toBeVisible();
  await page.getByRole("button", { name: "Let's start" }).click();
  await expect(page.getByText("Card 1 of 1")).toBeVisible();
  await page.getByRole("button", { name: "Show meaning" }).click();
  await page.getByRole("button", { name: "I knew it" }).click();
  await expect(page.getByRole("heading", { name: "du oder Sie?" })).toBeVisible();
  await expect(banner).toBeVisible();
  await page.getByRole("button", { name: "Got it – continue" }).click();

  // Listening with the native recording: the recording itself is played.
  await expect(page.getByRole("heading", { name: `Hören ${s}` })).toBeVisible();
  const [played] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/media/${mediaId}`)),
    page.getByRole("button", { name: "Play recording" }).click(),
  ]);
  expect(played.status()).toBe(200);
  await page.getByLabel("richtig").check();
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText("1 / 1 points (100%)")).toBeVisible();
  await page.getByRole("link", { name: "Next: Listening" }).click();

  // Listening without a recording: generated TTS, graded like a learner's (wrong, then right).
  const tts = exerciseBySlug.get("m1-begruessung-hoeren");
  await expect(page.getByRole("heading", { name: "Guten Morgen, Frau Weber!" })).toBeVisible();
  const [clip] = await Promise.all([
    page.waitForResponse((r) => /\/api\/media\/[0-9a-f]{24}/.test(r.url())),
    page.getByRole("button", { name: "Play recording" }).click(),
  ]);
  expect(clip.status()).toBeLessThan(400);
  const check = page.getByRole("button", { name: "Check answers" });
  await answer(page, tts, { wrong: true });
  await check.click();
  await expect(page.getByText(/Try again!/)).toBeVisible();
  await expect(page.getByText("Transcript")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await answer(page, tts);
  await check.click();
  await expect(page.getByText(`${tts.items.length} / ${tts.items.length} points (100%)`)).toBeVisible();
  await page.getByRole("link", { name: "Next: Speaking" }).click();

  // Speaking: a take is recorded and played back in the browser, never uploaded.
  const speaking = exerciseBySlug.get("m1-vorstellen-sprechen");
  const first = page.locator(`[data-item="${speaking.items[0].id}"]`);
  await expect(first.getByText("recordings stay in this browser")).toBeVisible();
  await first.getByRole("button", { name: "Record your answer" }).click();
  await expect(first.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.waitForTimeout(1200);
  await first.getByRole("button", { name: "Stop" }).click();
  await expect(first.getByLabel("Your new recording")).toBeVisible();
  await answer(page, speaking);
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("Done (not saved in preview).")).toBeVisible();
  await expect(page.getByText("Model answer").first()).toBeVisible();
  await page.getByRole("link", { name: "Back to the editor" }).last().click();
  await expect(page).toHaveURL(new RegExp(`/admin/lessons/${lessonId}$`));
  expect(uploads).toEqual([]);

  // Still a draft, still v1: previewing changed nothing.
  await expect(page.getByText("v1", { exact: true })).toBeVisible();

  // Learners can neither open the preview nor find the draft.
  const ctx = await browser.newContext();
  const learner = await ctx.newPage();
  await register(learner);
  await learner.goto(`/admin/lessons/${lessonId}/preview`);
  await expect(learner).toHaveURL(/\/dashboard\?error=forbidden/);
  await learner.goto(`/learn/a1/vorschau-modul-${s}/vorschau-${s}`);
  await expect(learner.getByRole("heading", { name: NOT_FOUND_HEADING })).toBeVisible();
  expect((await learner.request.get(`/api/media/${mediaId}`)).status()).toBe(404);
  await ctx.close();
});
