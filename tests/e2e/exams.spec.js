import { test, expect } from "@playwright/test";
import { answer, ensureA1Published, expectNoHorizontalOverflow, login, register, signOut, ADMIN } from "./helpers.js";
import { A1_PROBEPRUEFUNG_1 as EXAM } from "../../content/exams/a1/probepruefung-1.js";

// The seeded A1 practice exam, through the real learner UI on the production build:
// level page → exam overview → start → navigate (Next, palette) → unanswered warning in
// the confirmation → answer everything → submit → server-scored result and review →
// history. Plus the CMS preview, which stores nothing.

const bySlug = new Map(EXAM.exercises.map((e) => [e.slug, e]));
const tasks = EXAM.exam.sections.flatMap((s) => s.exercises.map((slug) => bySlug.get(slug)));
const questionCount = tasks.reduce((n, t) => n + t.items.length, 0);
const examPath = `/exams/a1/${EXAM.exam.slug}`;

test("a learner takes the A1 practice exam and gets a server-scored result", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await ensureA1Published(browser);
  await register(page);

  await page.goto("/learn/a1");
  await expect(page.getByRole("heading", { name: "Practice exams" })).toBeVisible();
  await page.locator(`[data-exam="${EXAM.exam.slug}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${examPath}$`));
  await expect(page.getByText(`${questionCount} questions in ${EXAM.exam.sections.length} parts`)).toBeVisible();
  await expect(page.getByText("You haven't taken this exam yet.")).toBeVisible();

  await page.getByRole("button", { name: "Start the exam" }).click();
  await expect(page).toHaveURL(/\/exams\/attempts\/[a-f0-9]{24}$/);
  const attemptUrl = page.url();
  await expect(page.getByTestId("exam-timer")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Questions/ })).toContainText(`${questionCount} left`);
  await expectNoHorizontalOverflow(page, "exam start");

  // Answer the first task, then check the palette state and the unanswered warning.
  await answer(page, tasks[0]);
  await expect(page.getByText(`${tasks[0].items.length} of ${questionCount} answered`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Question 1, answered, on this page" })).toBeVisible();
  await page.getByRole("button", { name: "Submit exam…" }).click();
  const dialog = page.getByRole("dialog", { name: "Submit the exam?" });
  await expect(dialog).toContainText(`${questionCount - tasks[0].items.length} of ${questionCount} questions`);
  await dialog.getByRole("button", { name: "Keep working" }).click();
  await expect(dialog).toBeHidden();

  // A reload keeps the answers (browser only) and the attempt.
  await page.reload();
  await expect(page.getByText(`${tasks[0].items.length} of ${questionCount} answered`)).toBeVisible();

  // Jump with the palette to the last question, then back with Previous.
  await page.getByRole("button", { name: new RegExp(`^Question ${questionCount}, not answered`) }).click();
  await expect(page.getByText(`Task ${tasks.length} of ${tasks.length}`)).toBeVisible();
  await page.getByRole("button", { name: "← Previous" }).click();
  await expect(page.getByText(`Task ${tasks.length - 1} of ${tasks.length}`)).toBeVisible();
  await page.getByRole("button", { name: "Question 1, answered" }).click();

  // Answer every task in order.
  for (const [i, task] of tasks.entries()) {
    await expect(page.getByText(`Task ${i + 1} of ${tasks.length}`)).toBeVisible();
    if (i > 0) await answer(page, task);
    if (i < tasks.length - 1) await page.getByRole("button", { name: "Next →" }).click();
  }
  await expect(page.getByText(`${questionCount} of ${questionCount} answered`)).toBeVisible();
  await page.getByRole("button", { name: "Finish exam" }).click();
  await expect(dialog).toContainText(`All ${questionCount} questions are answered.`);
  await dialog.getByRole("button", { name: "Submit now" }).click();

  await expect(page.getByTestId("exam-percent")).toHaveText("100%");
  await expect(page.getByTestId("exam-verdict")).toHaveText("Passed");
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByText("correct answer").first()).toBeVisible();
  await expectNoHorizontalOverflow(page, "exam result");

  // The result is stored: reloading shows it again, and the overview lists the attempt.
  await page.reload();
  await expect(page.getByTestId("exam-verdict")).toHaveText("Passed");
  await page.getByRole("link", { name: "Back to the exam overview" }).first().click();
  await expect(page.locator('[data-attempt-status="submitted"]')).toContainText("passed");

  // Another learner can't open this attempt (the not-found page is streamed, so the
  // status is checked through the page, as in the other specs).
  await signOut(page);
  await register(page);
  await page.goto(attemptUrl);
  await expect(page.getByRole("heading", { name: "Seite nicht gefunden" })).toBeVisible();
});

test("the CMS exam preview grades on the server and stores nothing", async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "authoring flow is desktop-only");
  test.setTimeout(120_000);
  await ensureA1Published(browser);
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/admin/exams");
  const row = page.getByRole("row", { name: new RegExp(EXAM.exam.title.de) });
  await row.getByRole("link", { name: "Preview" }).click();
  await expect(page.getByTestId("preview-banner")).toContainText("Nothing you do here is saved");

  await answer(page, tasks[0]);
  await page.getByRole("button", { name: "Submit exam…" }).click();
  await page.getByRole("dialog", { name: "Submit the exam?" }).getByRole("button", { name: "Submit now" }).click();
  await expect(page.getByTestId("exam-verdict")).toHaveText("Not passed");
  await expect(page.getByTestId("exam-score")).toContainText(`${tasks[0].items.length} of`);
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();

  // No attempt was created for the admin.
  await page.goto(examPath);
  await expect(page.getByText("You haven't taken this exam yet.")).toBeVisible();

  // Learners can't open the preview.
  await signOut(page);
  await register(page);
  await page.goto(page.url().replace(/\/dashboard$/, "") + "/admin/exams");
  await expect(page).toHaveURL(/\/dashboard\?error=forbidden$/);
});
