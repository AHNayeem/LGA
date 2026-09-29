import { test, expect } from "@playwright/test";
import { answer, ensureA1Published, expectNoHorizontalOverflow, login, register, ADMIN } from "./helpers.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";

// Critical learner journey on Module 1, through the real UI against the production build:
// dashboard → lesson → intro → flashcards → grammar → exercises (wrong, then right) →
// lesson complete → module progress → dashboard.

const NOT_FOUND_HEADING = "Seite nicht gefunden";
const exerciseBySlug = new Map(MODULE_1.exercises.map((e) => [e.slug, e]));
const lesson1 = MODULE_1.lessons[0];

test("a learner completes Module 1, lesson 1, and progress updates", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await ensureA1Published(browser);
  await register(page);

  // Dashboard points at the first lesson.
  const cont = page.getByRole("link", { name: /Continue learning/ });
  await expect(cont).toContainText("Hallo und Tschüs!");
  await expect(page.locator('[data-module="hallo"] [data-testid="module-percent"]')).toHaveText("0%");
  await cont.click();
  await expect(page).toHaveURL(/\/learn\/a1\/hallo\/hallo-und-tschuess\?block=intro$/);

  for (const block of lesson1.blocks) {
    await expect(page).toHaveURL(new RegExp(`block=${block.key}$`));
    await expectNoHorizontalOverflow(page, block.key);
    if (block.type === "intro") {
      await page.getByRole("button", { name: "Let's start" }).click();
    } else if (block.type === "vocabulary") {
      for (let i = 0; i < block.vocab.length; i++) {
        await expect(page.getByText(`Card ${i + 1} of ${block.vocab.length}`)).toBeVisible();
        if (i === 0) {
          // Generated audio is served through the authenticated media route.
          await page.getByRole("button", { name: "Listen", exact: true }).click();
          await expect(page.getByRole("button", { name: "Listen", exact: true })).toBeEnabled();
          await expect(page.getByText("Audio could not be loaded.")).toHaveCount(0);
        }
        await page.getByRole("button", { name: "Show meaning" }).click();
        await page.getByRole("button", { name: i % 2 ? "Not yet" : "I knew it" }).click();
      }
    } else if (block.type === "grammar") {
      await expect(page.getByRole("heading", { name: "du oder Sie?" })).toBeVisible();
      await page.getByRole("button", { name: "Got it – continue" }).click();
    } else {
      const exercise = exerciseBySlug.get(block.exercise);
      const check = page.getByRole("button", { name: "Check answers" });
      await expect(check).toBeDisabled(); // every question must be answered first

      if (exercise.stimulus?.audio) {
        await page.getByRole("button", { name: "Play recording" }).click();
        await expect(page.getByTestId("plays")).toHaveText("1 of 2 plays left");
      }

      // First attempt wrong: stored, feedback shown, step not completed.
      await answer(page, exercise, { wrong: true });
      await check.click();
      await expect(page.getByText(/Try again!/)).toBeVisible();
      await expect(page.getByText("✗ Not quite").first()).toBeVisible();
      if (exercise.stimulus?.audio) await expect(page.getByText("Transcript")).toBeVisible();

      // Second attempt right.
      await page.getByRole("button", { name: "Try again" }).click();
      await answer(page, exercise);
      await check.click();
      const total = exercise.items.reduce((n, i) => n + (i.type === "match" ? i.pairs.length : 1), 0);
      await expect(page.getByText(`${total} / ${total} points (100%)`)).toBeVisible();
      await page.getByRole("link", { name: /^Next:|Back to module/ }).click();
    }
  }

  // Lesson complete → module page.
  await expect(page).toHaveURL(/\/learn\/a1\/hallo$/);
  await expect(page.getByText("1 of 6 lessons completed")).toBeVisible();
  await expectNoHorizontalOverflow(page, "module page");
  await expect(page.getByRole("link", { name: /Hallo und Tschüs!/ })).toContainText("Completed");
  await expect(page.locator('[data-skill="vocabulary"]')).toContainText("Not yet"); // other lessons still count as 0
  await expect(page.getByText("Targets are this app's learning goals, not official Goethe pass marks.")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Continue learning/ })).toContainText("Ich heiße");
  await expect(page.locator('[data-module="hallo"] [data-testid="module-percent"]')).not.toHaveText("0%");
  await expectNoHorizontalOverflow(page, "dashboard");
});

test("answer keys never reach the browser and unknown lessons 404", async ({ page, browser }) => {
  await ensureA1Published(browser);
  await register(page);
  await page.goto("/learn/a1/hallo/ich-heisse?block=heissen-sein");
  await expect(page.getByRole("heading", { name: "heißen und sein" })).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain("heisst"); // an accepted spelling variant of an answer
  expect(html).not.toContain("accepted");
  expect(html).not.toContain("modelAnswer");

  // Streaming (root loading.js) makes these soft 404s: not-found page + noindex.
  for (const url of ["/learn/a1/hallo/gibt-es-nicht", "/learn/zz/hallo"]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: NOT_FOUND_HEADING })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  }

  await page.goto("/review");
  await expect(page.getByText("Nothing to review right now.")).toBeVisible();
});

test("admin sees the Module 1 review page with lifecycle state", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/admin");
  await page.getByRole("link", { name: "Review content" }).first().click();
  await expect(page.getByRole("heading", { name: /Review: A1 · Hallo!/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Exercises \(26\)/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish all approved" })).toBeVisible();
  // Seeded AI-drafted content went through review before publishing.
  await expect(page.getByText("Source: ai_generated", { exact: false })).toBeVisible();
  const exerciseRow = page.getByRole("row", { name: /m1-gruessen-situationen/ });
  await expect(exerciseRow.getByText("approved", { exact: true })).toBeVisible();
  await expect(exerciseRow.getByText("published", { exact: true })).toBeVisible();
});
