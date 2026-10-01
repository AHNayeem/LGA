import { test, expect } from "@playwright/test";
import { answer, ensureA1Published, expectNoHorizontalOverflow, register } from "./helpers.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";
import { A1_PROBEPRUEFUNG_1 as EXAM } from "../../content/exams/a1/probepruefung-1.js";

// Learner QA journeys (Phase 10), desktop and Pixel 7, on the production build:
//   - guest mistake → Review → source exercise → retry, and the mistake is gone
//   - guest practice exam: reload and closing the browser keep the answers and the clock,
//     an attempt whose time ran out isn't scored, submit → result → part practice
//   - corrupted guest storage never breaks a page
//   - a session that ends mid-lesson leads back to the lesson after signing in
//   - a slow server shows the pending state and accepts one submission

const exerciseBySlug = new Map(MODULE_1.exercises.map((e) => [e.slug, e]));
const lesson2 = MODULE_1.lessons[1];
const graded = lesson2.blocks.find((b) => b.exercise && exerciseBySlug.get(b.exercise).items.every((i) => i.type !== "speak_prompt"));
const gradedExercise = exerciseBySlug.get(graded.exercise);
const gradedUrl = `/learn/a1/hallo/${lesson2.slug}?block=${graded.key}`;

const bySlug = new Map(EXAM.exercises.map((e) => [e.slug, e]));
const tasks = EXAM.exam.sections.flatMap((s) => s.exercises.map((slug) => bySlug.get(slug)));
const questionCount = tasks.reduce((n, t) => n + t.items.length, 0);
const examPath = `/exams/a1/${EXAM.exam.slug}`;

const draftKeys = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("lga:exam-draft:")));
async function timerMinutes(page) {
  const t = await page.getByTestId("exam-timer").innerText();
  const [, a, b, c] = t.match(/(\d+):(\d\d)(?::(\d\d))?/);
  return c ? Number(a) * 60 + Number(b) : Number(a);
}

test.beforeEach(async ({ browser }) => {
  await ensureA1Published(browser);
});

test("guest: a mistake shows in Review, leads back to its exercise, and disappears once it's right", async ({ page }) => {
  await page.goto(gradedUrl);
  await answer(page, gradedExercise, { wrong: true });
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText(/Try again!/)).toBeVisible();

  await page.goto("/review");
  await expect(page.getByTestId("mistake-count")).toHaveText("(1)");
  await expect(page.locator("[data-mistake]")).toContainText("last time");
  await expectNoHorizontalOverflow(page, "review with a mistake");
  await page.getByTestId("mistakes").getByRole("link", { name: "Practise again" }).click();
  await expect(page).toHaveURL(new RegExp(`${lesson2.slug}\\?block=${graded.key}$`));

  // The retry: the previous attempt is remembered, the right answers clear the mistake.
  await expect(page.getByText(/1 attempt so far/)).toBeVisible();
  await answer(page, gradedExercise);
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByRole("link", { name: /^Next:|See your lesson result/ }).last()).toBeVisible();

  await page.goto("/review");
  await expect(page.getByTestId("mistake-count")).toHaveText("(0)");
  await expect(page.getByText("No mistakes to practise.")).toBeVisible();
});

test("guest: the practice exam survives a reload and a closed browser, and an expired attempt isn't scored", async ({ page, browser }) => {
  test.setTimeout(240_000);
  await page.goto(examPath);
  await expect(page.getByTestId("guest-exam-start")).toHaveText("Start the practice exam");
  await page.getByTestId("guest-exam-start").click();
  await expect(page).toHaveURL(/\?take=1$/);
  await expect(page.getByTestId("exam-timer")).toBeVisible();
  const startMinutes = await timerMinutes(page);
  expect(startMinutes).toBeLessThanOrEqual(EXAM.exam.durationMinutes);

  await answer(page, tasks[0]);
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByText(`${tasks[0].items.length} of ${questionCount} answered`)).toBeVisible();
  expect(await draftKeys(page)).toHaveLength(1);

  // Reload: same answers, same task, and the clock keeps running (it doesn't restart).
  await page.reload();
  await expect(page.getByText(`${tasks[0].items.length} of ${questionCount} answered`)).toBeVisible();
  await expect(page.getByText(`Task 2 of ${tasks.length}`)).toBeVisible();
  expect(await timerMinutes(page)).toBeLessThanOrEqual(startMinutes);

  // Close the browser and come back: the overview offers to continue.
  const saved = await page.context().storageState();
  const reopened = await browser.newContext({ storageState: saved });
  const again = await reopened.newPage();
  await again.goto(examPath);
  await expect(again.getByTestId("guest-exam-start")).toHaveText("Continue your practice exam");
  await expect(again.getByText(/Your answers so far are saved in this browser, about \d+ minutes? left/)).toBeVisible();
  await again.getByTestId("guest-exam-start").click();
  await expect(again.getByText(`${tasks[0].items.length} of ${questionCount} answered`)).toBeVisible();

  // Time ran out while away (plus the grace): like an expired attempt, it isn't scored.
  await again.evaluate((minutes) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("lga:exam-draft:"));
    const d = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...d, startedAt: Date.now() - (minutes + 5) * 60_000, savedAt: Date.now() }));
  }, EXAM.exam.durationMinutes);
  await again.reload();
  await expect(again.getByText(/ran out of time while you were away, so it wasn't scored/)).toBeVisible();
  await expect(again.getByText(`0 of ${questionCount} answered`)).toBeVisible();
  await reopened.close();
});

test("guest: a full practice exam → result → practice for the weakest part; the draft is gone afterwards", async ({ page, isMobile }) => {
  test.setTimeout(240_000);
  await page.goto(`${examPath}?take=1`);
  for (const [i, task] of tasks.entries()) {
    await expect(page.getByText(`Task ${i + 1} of ${tasks.length}`)).toBeVisible();
    await answer(page, task, { wrong: i === 0 }); // Hören Teil 1 wrong
    if (i < tasks.length - 1) await page.getByRole("button", { name: "Next →" }).click();
  }
  if (isMobile) await expectNoHorizontalOverflow(page, "exam last task");
  await page.getByRole("button", { name: "Finish exam" }).click();
  await page.getByRole("dialog", { name: "Submit the exam?" }).getByRole("button", { name: "Submit now" }).click();
  await expect(page.getByTestId("exam-verdict")).toBeVisible();
  expect(await draftKeys(page)).toEqual([]);

  await page.locator('[data-section="hoeren"]').getByRole("link", { name: "Practise this part" }).click();
  await expect(page).toHaveURL(/\/goethe\/a1\/hoeren$/);
  await expect(page.getByRole("heading", { name: "Hören" })).toBeVisible();
  await expect(page.getByText(/In your last practice exam/)).toBeVisible();
  await expect(page.getByTestId("part-format")).toContainText("Teil 2");
  await expect(page.getByTestId("part-reason")).toContainText("Why this one:");
  await expectNoHorizontalOverflow(page, "goethe part");
  await page.getByTestId("part-primary").click();
  await expect(page).toHaveURL(/\/learn\/a1\/[a-z0-9-]+\/[a-z0-9-]+\?block=[a-z0-9-]+&from=goethe-hoeren$/);

  // Practise, then straight back to the part.
  await expect(page.getByTestId("return-link")).toHaveText("← Back to Hören practice");
  await page.getByRole("link", { name: "Back to Hören practice" }).last().click();
  await expect(page).toHaveURL(/\/goethe\/a1\/hoeren$/);

  // Schreiben says plainly what LGA doesn't practise.
  await page.goto("/goethe/a1/schreiben");
  await expect(page.getByTestId("part-coverage")).toContainText("Not practised in LGA: Free writing (Teil 2");
});

test("guest: corrupted browser storage never breaks a page", async ({ page }) => {
  await page.goto("/");
  for (const stored of [
    "{not json",
    JSON.stringify({ version: 1, lessons: { x: { exercises: { y: { attempts: 1, last: {} } } } }, exams: { z: [{ score: 1, sections: "no" }] }, vocab: { v: { box: 9 } }, profile: { goal: "hack" } }),
    JSON.stringify({ version: 1, lessons: "x", exams: [1], vocab: null, profile: 3 }),
  ]) {
    await page.evaluate((v) => localStorage.setItem("lga:guest:v1", v), stored);
    for (const [path, heading] of [
      ["/dashboard", /Willkommen/],
      ["/review", /Review/],
      ["/goethe/a1", /Prepare for the Goethe exam/],
      ["/learn/a1", /A1/],
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading }), `${path} with ${stored.slice(0, 30)}`).toBeVisible();
    }
    await page.goto(examPath);
    await expect(page.getByTestId("guest-exam-start")).toBeVisible();
  }
});

test("signed in: when the session ends mid-lesson, signing in again leads back to the lesson", async ({ page }) => {
  const user = await register(page);
  await page.goto(gradedUrl);
  await answer(page, gradedExercise);
  await page.context().clearCookies();
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText(/Your session has ended, so this wasn't saved/)).toBeVisible();
  await page.getByRole("link", { name: "Sign in again" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  // Sign in on this page (the login() helper opens a plain /login).
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${lesson2.slug}\\?block=${graded.key}$`));
  await expect(page.getByRole("button", { name: "Check answers" })).toBeVisible();
});

test("a slow server shows the pending state and takes one submission", async ({ page }) => {
  let actions = 0;
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.headers()["next-action"]) {
      actions++;
      await new Promise((r) => setTimeout(r, 1500));
    }
    await route.continue();
  });
  await page.goto(gradedUrl);
  await answer(page, gradedExercise);
  const check = page.getByRole("button", { name: "Check answers" });
  await check.click();
  const pending = page.getByRole("button", { name: "Checking…" });
  await expect(pending).toBeDisabled();
  await pending.click({ force: true }).catch(() => {}); // a second tap while waiting does nothing
  await expect(page.getByRole("link", { name: /^Next:|See your lesson result/ }).last()).toBeVisible({ timeout: 15_000 });
  expect(actions).toBe(1);
});
