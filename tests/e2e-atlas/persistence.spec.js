import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { answer, expectNoHorizontalOverflow, login, register, signOut } from "../e2e/helpers.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";

// Two phases around an application restart (see scripts/atlas-e2e.mjs). Phase 1 creates
// learner state on Atlas; phase 2 runs against a NEW server process and checks it.

const PHASE = process.env.ATLAS_E2E_PHASE;
const stateFile = (project) => `${process.env.ATLAS_E2E_STATE_DIR}/${project}.json`;
const exerciseBySlug = new Map(MODULE_1.exercises.map((e) => [e.slug, e]));
const lesson1 = MODULE_1.lessons[0];
const SPEAKING = "/learn/a1/hallo/ich-heisse?block=vorstellen-sprechen";

test("phase 1: register, learn, record (real database)", async ({ page }, info) => {
  test.skip(PHASE !== "1");
  const user = await register(page);
  await expect(page.locator('[data-module="hallo"]')).toBeVisible(); // published Module 1
  await page.getByRole("link", { name: /Continue learning/ }).click();

  let attempts = 0;
  let vocabulary = 0;
  for (const block of lesson1.blocks) {
    await expect(page).toHaveURL(new RegExp(`block=${block.key}$`));
    if (block.type === "intro") await page.getByRole("button", { name: "Let's start" }).click();
    else if (block.type === "grammar") await page.getByRole("button", { name: "Got it – continue" }).click();
    else if (block.type === "vocabulary") {
      for (let i = 0; i < block.vocab.length; i++) {
        await expect(page.getByText(`Card ${i + 1} of ${block.vocab.length}`)).toBeVisible();
        await page.getByRole("button", { name: "Show meaning" }).click();
        await page.getByRole("button", { name: "I knew it" }).click();
      }
      vocabulary += block.vocab.length;
    } else {
      await answer(page, exerciseBySlug.get(block.exercise));
      await page.getByRole("button", { name: "Check answers" }).click();
      await expect(page.getByText(/points \(100%\)/)).toBeVisible();
      attempts++;
      await page.getByRole("link", { name: /^Next:|Back to module/ }).click();
    }
  }
  await expect(page.getByText("1 of 6 lessons completed")).toBeVisible();

  // Speaking: record q1, rate all, submit.
  await page.goto(SPEAKING);
  const q1 = page.locator('[data-item="q1"]');
  await q1.getByRole("button", { name: "Record your answer" }).click();
  await page.waitForTimeout(1500);
  await q1.getByRole("button", { name: "Stop" }).click();
  await expect(q1.getByLabel("Your new recording")).toBeVisible();
  for (const id of ["q1", "q2", "q3"]) await page.locator(`[data-item="${id}"]`).getByLabel("I could say it").check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(q1.getByText("Recording saved privately to your account.")).toBeVisible();
  attempts++;
  await expectNoHorizontalOverflow(page, "speaking");
  await signOut(page);

  writeFileSync(stateFile(info.project.name), JSON.stringify({ project: info.project.name, ...user, expected: { attempts, vocabulary } }));
});

test("phase 2: after a restart, log in again and find everything", async ({ page }, info) => {
  test.skip(PHASE !== "2");
  const s = JSON.parse(readFileSync(stateFile(info.project.name), "utf8"));
  await login(page, s.email, s.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: /Continue learning/ })).toContainText("Ich heiße");
  await expect(page.locator('[data-module="hallo"] [data-testid="module-percent"]')).not.toHaveText("0%");

  await page.goto("/learn/a1/hallo");
  await expect(page.getByText("1 of 6 lessons completed")).toBeVisible();
  await expect(page.getByRole("link", { name: /Hallo und Tschüs!/ })).toContainText("Completed");

  // Lesson steps (including the word block) are still done.
  await page.goto("/learn/a1/hallo/hallo-und-tschuess?block=woerter");
  await expect(page.getByRole("navigation", { name: "Lesson steps" }).getByText("(not done)")).toHaveCount(0);

  // The recording is still there and playable by its owner.
  await page.goto(SPEAKING);
  const previous = page.locator('[data-item="q1"]').getByTestId("previous-recording");
  await expect(previous).toBeVisible();
  const src = await previous.locator("audio").getAttribute("src");
  const res = await page.request.get(src);
  expect(res.status()).toBe(200);
  expect((await res.body()).byteLength).toBeGreaterThan(100);
});
