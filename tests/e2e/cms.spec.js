import { test, expect } from "@playwright/test";
import { ensureA1Published, login, register, ADMIN } from "./helpers.js";

// CMS Phase 1 through the real admin UI against the production build: an admin authors a
// word and a lesson (block composer with the vocabulary picker) without touching code or
// seed files; new content stays a draft and invisible to learners.

const suffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

async function loginAdmin(page) {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("admin creates, validates and edits a vocabulary item", async ({ page, isMobile }) => {
  // Authoring is a desktop workflow; the mobile project covers the learner journeys.
  test.skip(isMobile, "admin authoring runs on desktop only");
  const s = suffix();
  await loginAdmin(page);
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Vocabulary" }).click();
  await expect(page.getByRole("heading", { name: "Vocabulary", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "New word" }).click();

  await page.getByLabel("Lemma *").fill("Fenster");
  await page.getByLabel("Slug").fill(`fenster-${s}`);
  await page.getByRole("group", { name: /Meanings/ }).getByLabel("English *").fill("window");
  await page.getByRole("group", { name: /Example sentence/ }).getByLabel("Deutsch").fill("Das Fenster ist offen.");

  // Server-side validation: nouns need an article.
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Nouns need an article" })).toBeVisible();

  await page.getByLabel("Article *").selectOption("das");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/vocabulary\/[0-9a-f]{24}\?created=1$/);
  await expect(page.getByRole("status").filter({ hasText: "created as a draft" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "das Fenster" })).toBeVisible();

  await page.getByLabel("Plural").fill("die Fenster");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved as v2 · draft · unpublished")).toBeVisible();

  await page.goto(`/admin/vocabulary?q=fenster-${s}`);
  const row = page.getByRole("row", { name: /das Fenster/ });
  await expect(row).toHaveCount(1);
  await expect(row.getByText("die Fenster")).toBeVisible();
  await expect(row.getByText("draft", { exact: true })).toBeVisible();
});

test("admin composes a lesson from library content; learners don't see the draft", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "admin authoring runs on desktop only");
  test.setTimeout(90_000);
  const s = suffix();
  const title = `Entwurf ${s}`;
  await ensureA1Published(browser);
  await loginAdmin(page);
  await page.goto("/admin/lessons/new");

  await page.getByLabel("Module").selectOption({ label: "A1 · Hallo!" });
  await page.getByLabel("Slug").fill(`entwurf-${s}`);
  await page.getByLabel("Order").fill("50");
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(title);

  // Block 1: intro.
  await page.getByRole("button", { name: "+ Add block" }).click();
  const blocks = page.getByTestId("lesson-block");
  await blocks.nth(0).getByRole("group", { name: /^Text/ }).getByLabel("English").fill("A lesson written in the CMS.");

  // Block 2: vocabulary, picked from the library.
  await page.getByLabel("New block type").selectOption("vocabulary");
  await page.getByRole("button", { name: "+ Add block" }).click();
  const picker = blocks.nth(1).getByRole("group", { name: "Add words from the vocabulary library" });
  await picker.getByRole("searchbox").fill("Guten Morgen");
  await picker.getByRole("button", { name: "Add Guten Morgen!" }).click();
  await expect(blocks.nth(1).getByRole("link", { name: "Guten Morgen!" })).toBeVisible();

  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/lessons\/[0-9a-f]{24}\?created=1$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(blocks).toHaveCount(2);
  await expect(blocks.nth(0).getByLabel("Key")).toBeDisabled(); // saved keys are locked
  await expect(blocks.nth(1).getByRole("link", { name: "Guten Morgen!" })).toBeVisible();

  // Reorder and save: keys stay, the version increases.
  await blocks.nth(1).getByRole("button", { name: "Move block 2 up" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved as v2 · draft · unpublished")).toBeVisible();
  await expect(blocks.nth(0).getByRole("heading")).toHaveText("Block 1 · Vocabulary (flashcards)");

  // Listed as a draft in the module's lessons.
  await page.goto("/admin/lessons?q=" + encodeURIComponent(`entwurf-${s}`));
  await expect(page.getByRole("row", { name: new RegExp(title) }).getByText("draft", { exact: true })).toBeVisible();

  // A learner sees the published module, but not the draft lesson.
  const ctx = await browser.newContext();
  const learner = await ctx.newPage();
  await register(learner);
  await learner.goto("/learn/a1/hallo");
  await expect(learner.getByText("Hallo und Tschüs!").first()).toBeVisible();
  await expect(learner.getByText(title)).toHaveCount(0);
  await learner.goto(`/learn/a1/hallo/entwurf-${s}`);
  await expect(learner.getByRole("heading", { name: "Seite nicht gefunden" })).toBeVisible();
  await ctx.close();
});

test("admin selects several list rows and moves them one review step", async ({ page, isMobile }) => {
  test.skip(isMobile, "admin authoring runs on desktop only");
  test.setTimeout(90_000);
  const s = suffix();
  await loginAdmin(page);
  for (const lemma of ["Tisch", "Stuhl"]) {
    await page.goto("/admin/vocabulary/new");
    await page.getByLabel("Lemma *").fill(lemma);
    await page.getByLabel("Slug").fill(`${lemma.toLowerCase()}-${s}`);
    await page.getByLabel("Article *").selectOption("der");
    await page.getByRole("group", { name: /Meanings/ }).getByLabel("English *").fill(lemma);
    await page.getByRole("button", { name: "Create draft" }).click();
    await expect(page).toHaveURL(/\?created=1$/);
  }

  await page.goto(`/admin/vocabulary?q=${s}`);
  const bar = page.getByTestId("bulk-bar");
  await expect(bar.getByRole("button", { name: "Mark reviewed" })).toBeDisabled();
  await page.getByLabel("Select all on this page").check();
  await expect(bar.getByText("2 selected")).toBeVisible();
  await bar.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(bar.getByText("2 changed")).toBeVisible();
  await expect(page.getByRole("row", { name: /der Tisch/ }).getByText("reviewed", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /der Stuhl/ }).getByText("reviewed", { exact: true })).toBeVisible();

  await page.getByLabel(`Select tisch-${s}`).check();
  await expect(bar.getByText("1 selected")).toBeVisible();
  await bar.getByRole("button", { name: "Approve" }).click();
  await expect(bar.getByText("1 changed")).toBeVisible();
  await expect(page.getByRole("row", { name: /der Tisch/ }).getByText("approved", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /der Stuhl/ }).getByText("reviewed", { exact: true })).toBeVisible();
});

test("a learner cannot open the CMS editors", async ({ page }) => {
  await register(page);
  for (const path of ["/admin/vocabulary", "/admin/lessons/new", "/admin/review"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard\?error=forbidden/);
  }
});
