import { test, expect } from "@playwright/test";
import { answer, ensureA1Published, expectNoHorizontalOverflow, login, register, signOut } from "./helpers.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";
import { A1_PROBEPRUEFUNG_1 as EXAM } from "../../content/exams/a1/probepruefung-1.js";

// Learning without an account, through the real UI on the production build (desktop and
// Pixel 7): home → start → onboarding → learner home → lesson → result → next lesson →
// review → Goethe Prep → practice exam. Guest progress lives in the browser only; an
// account keeps it on the server.

const exerciseBySlug = new Map(MODULE_1.exercises.map((e) => [e.slug, e]));
const [lesson1, lesson2] = MODULE_1.lessons;

// Plays every step of a lesson; `wrongOnce` answers each exercise wrong first.
async function playLesson(page, lesson, { wrongOnce = false } = {}) {
  for (const block of lesson.blocks) {
    await expect(page).toHaveURL(new RegExp(`block=${block.key}$`));
    if (block.type === "intro") {
      await page.getByRole("button", { name: "Let's start" }).click();
    } else if (block.type === "vocabulary") {
      for (let i = 0; i < block.vocab.length; i++) {
        await expect(page.getByText(`Card ${i + 1} of ${block.vocab.length}`)).toBeVisible();
        await page.getByRole("button", { name: "Show meaning" }).click();
        await page.getByRole("button", { name: i % 2 ? "Not yet" : "I knew it" }).click();
      }
    } else if (block.type === "grammar") {
      await page.getByRole("button", { name: "Got it – continue" }).click();
    } else {
      const exercise = exerciseBySlug.get(block.exercise);
      const check = page.getByRole("button", { name: /Check answers|Finish/ });
      if (wrongOnce && exercise.items.every((i) => i.type !== "speak_prompt")) {
        await answer(page, exercise, { wrong: true });
        await check.click();
        await expect(page.getByText(/Try again!/)).toBeVisible();
        await page.getByRole("button", { name: "Try again" }).click();
      }
      await answer(page, exercise);
      await check.click();
      await page.getByRole("link", { name: /^Next:|See your lesson result/ }).last().click();
    }
  }
  await expect(page).toHaveURL(/\?view=result$/);
}

test("a new guest learns, reviews and prepares for Goethe without an account", async ({ page, browser, isMobile }) => {
  test.setTimeout(300_000);
  await ensureA1Published(browser);

  // Home → Start learning → onboarding.
  await page.goto("/");
  await page.getByRole("link", { name: "Start learning" }).click();
  await expect(page).toHaveURL(/\/start$/);
  await page.getByLabel(/Learn German from zero/).check();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByLabel(/I'm new to German/)).toBeChecked();
  await page.getByRole("button", { name: "Start learning" }).click();

  // Learner home: one obvious action, no invented progress.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Willkommen!" })).toBeVisible();
  await expect(page.getByText("Goal: learn german from zero")).toBeVisible();
  await expect(page.getByTestId("lessons-completed")).toContainText("0 of");
  await expect(page.getByTestId("skill-bars")).toContainText("Not started yet");
  await expect(page.getByTestId("today-plan")).toContainText(lesson1.title.de);
  if (isMobile) await expect(page.getByRole("navigation", { name: "Learning" })).toBeVisible();
  await expectNoHorizontalOverflow(page, "guest home");
  await page.getByTestId("primary-action").click();

  // Lesson 1, with mistakes first and then right answers: the guest's own step state.
  await expect(page).toHaveURL(/\/learn\/a1\/hallo\/hallo-und-tschuess\?block=intro$/);
  if (isMobile) await expect(page.getByRole("navigation", { name: "Learning" })).toHaveCount(0); // focus mode
  await playLesson(page, lesson1, { wrongOnce: true });
  const result = page.getByTestId("lesson-result");
  await expect(result.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  await expect(page.getByTestId("save-progress")).toBeVisible(); // non-blocking account invitation
  await expectNoHorizontalOverflow(page, "lesson result");

  // Reload: the browser still knows the lesson is done.
  await page.reload();
  await expect(result.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  await result.getByRole("link", { name: /Next lesson: Ich heiße/ }).click();

  // Lesson 2: fail the first graded exercise and leave it for the review.
  await expect(page).toHaveURL(/ich-heisse\?block=intro$/);
  const graded = lesson2.blocks.find((b) => b.exercise && exerciseBySlug.get(b.exercise).items.every((i) => i.type !== "speak_prompt"));
  await page.goto(`/learn/a1/hallo/ich-heisse?block=${graded.key}`);
  await answer(page, exerciseBySlug.get(graded.exercise), { wrong: true });
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText(/Try again!/)).toBeVisible();

  // Review: the mistake leads straight back to the exercise.
  await page.goto("/review");
  await expect(page.getByTestId("mistake-count")).toHaveText("(1)");
  const mistake = page.getByTestId("mistakes").getByRole("link", { name: "Practise again" });
  await mistake.click();
  await expect(page).toHaveURL(new RegExp(`ich-heisse\\?block=${graded.key}$`));
  await expect(page.getByText(/1 attempt so far/)).toBeVisible();

  // A new tab of the same browser (same device) sees the same guest progress.
  const again = await page.context().newPage();
  await again.goto("/dashboard");
  await expect(again.getByTestId("lessons-completed")).toContainText("1 of");
  await expect(again.getByTestId("primary-action")).toContainText("Ich heiße");
  await again.close();

  // Goethe Prep → an exam part → the practice exam, graded right away, not stored.
  await page.goto("/goethe");
  await expect(page).toHaveURL(/\/goethe\/a1$/);
  await expect(page.getByText(/not an official Goethe-Institut product/).first()).toBeVisible();
  await page.locator('[data-part="hoeren"]').click();
  await expect(page.getByRole("heading", { name: "Hören" })).toBeVisible();
  await expect(page.getByTestId("part-primary")).toBeVisible();
  await expectNoHorizontalOverflow(page, "goethe part");
  await page.getByRole("link", { name: "Practice exam" }).click();
  await expect(page).toHaveURL(new RegExp(`/exams/a1/${EXAM.exam.slug}$`));
  await page.getByRole("link", { name: "Start the practice exam" }).click();
  await expect(page).toHaveURL(/\?take=1$/);
  const bySlug = new Map(EXAM.exercises.map((e) => [e.slug, e]));
  const tasks = EXAM.exam.sections.flatMap((s) => s.exercises.map((slug) => bySlug.get(slug)));
  for (const [i, task] of tasks.entries()) {
    await expect(page.getByText(`Task ${i + 1} of ${tasks.length}`)).toBeVisible();
    // Everything right except the listening part, to see the targeted practice link.
    await answer(page, task, { wrong: i === 0 });
    if (i < tasks.length - 1) await page.getByRole("button", { name: "Next →" }).click();
  }
  await page.getByRole("button", { name: "Finish exam" }).click();
  await page.getByRole("dialog", { name: "Submit the exam?" }).getByRole("button", { name: "Submit now" }).click();
  await expect(page.getByTestId("exam-verdict")).toBeVisible();
  await expect(page.locator('[data-section="hoeren"]').getByRole("link", { name: "Practise this part" })).toBeVisible();
  await expect(page.getByTestId("save-progress")).toBeVisible();
  await expectNoHorizontalOverflow(page, "guest exam result");
  await page.getByRole("button", { name: "Back to the exam overview" }).click();
  await expect(page.getByTestId("guest-exam-history")).toContainText("LGA practice target");

  // Creating an account afterwards starts clean: guest progress is not account progress.
  await register(page);
  await expect(page.getByTestId("lessons-completed")).toContainText("0 of");
});

test("a signed-in learner's progress persists across refresh and sign-in", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await ensureA1Published(browser);
  const user = await register(page);
  await page.getByTestId("primary-action").click();
  await playLesson(page, lesson1);
  await expect(page.getByTestId("lesson-result").getByRole("heading", { name: "Lesson complete!" })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("lesson-result").getByRole("heading", { name: "Lesson complete!" })).toBeVisible();

  // Stored on the server: gone from this browser, back after signing in again.
  await signOut(page);
  await page.goto("/dashboard");
  await expect(page.getByTestId("lessons-completed")).toContainText("0 of");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("lessons-completed")).toContainText("1 of");
  await expect(page.getByTestId("primary-action")).toContainText("Ich heiße");
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: /Review/ })).toBeVisible();
  await page.goto("/goethe/a1");
  await expect(page.locator('[data-part="hoeren"]')).toContainText("practised");
});
