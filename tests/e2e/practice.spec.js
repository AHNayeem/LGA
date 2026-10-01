import { test, expect } from "@playwright/test";
import { answer, ensureA1Published, expectNoHorizontalOverflow, register } from "./helpers.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";

// Practice by topic (docs/PRACTICE.md), desktop and Pixel 7, on the production build:
//   - dashboard → Practice → grammar topic → exercise in its lesson → back to the topic
//   - a wrong answer: the item's own explanation, else the lesson's grammar rule ("Why?"),
//     and no rule where none applies
//   - Try again keeps the right answers and the final score is the full exercise's
//   - weak topics on the dashboard and in Review, from attempts only
//   - word topics: flashcards in both directions, the choice is remembered
//   - signed in: the same pages, numbers from the account

const exercises = new Map(MODULE_1.exercises.map((e) => [e.slug, e]));
const HEISSEN = exercises.get("m1-heissen-sein"); // q1 has no explanation, q2 has one
const LESEN = exercises.get("m1-vorstellung-lesen"); // reading: no grammar rule applies
const TOPIC = "verben-praesens-modul-1";
const topicPath = `/practice/a1/grammar/${TOPIC}`;
const heissenUrl = `/learn/a1/hallo/ich-heisse?block=heissen-sein&from=grammar-${TOPIC}`;

const item = (page, id) => page.locator(`[data-item="${id}"]`);

// Answers m1-heissen-sein with the given items wrong.
async function answerHeissen(page, wrong = []) {
  for (const it of HEISSEN.items) {
    await item(page, it.id).getByRole("textbox").fill(wrong.includes(it.id) ? "xyz" : it.accepted[0]);
  }
}

// Once per file and project: every publish logs the admin in, and the per-email login
// limit (8 / 15 min) is shared with the specs that run after this one.
test.beforeAll(async ({ browser }) => {
  await ensureA1Published(browser);
});

test("guest: dashboard → Practice → topic → exercise with the way back; Why?, retry and weak topics", async ({ page }) => {
  await page.goto("/dashboard");
  const card = page.getByTestId("practice-card");
  await expect(card).toBeVisible();
  // A new learner: no "Needs practice" without attempts.
  await expect(page.getByTestId("dashboard-weak-topics")).toHaveCount(0);
  await card.getByRole("link", { name: /Grammar/ }).click();
  await expect(page).toHaveURL(/\/practice\/a1#grammar$/);
  await expect(page.locator(`[data-topic="${TOPIC}"]`)).toContainText("Not practised yet");
  await expect(page.getByTestId("word-topics").locator("[data-word-topic]").first()).toBeVisible();
  await expectNoHorizontalOverflow(page, "practice overview");

  await page.locator(`[data-topic="${TOPIC}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${topicPath}$`));
  await expect(page.getByTestId("topic-status")).toContainText("Not practised yet");
  await expect(page.locator("summary", { hasText: "The rule" })).toBeVisible();
  await expectNoHorizontalOverflow(page, "grammar topic");
  await page.getByTestId("practise-now").click();
  await expect(page).toHaveURL(new RegExp(`block=heissen-sein&from=grammar-${TOPIC}$`));
  await expect(page.getByTestId("return-link")).toHaveText("← Back to grammar practice");

  // Two wrong: q1 (no explanation → the grammar rule), q2 (its own explanation, no rule).
  await answerHeissen(page, ["q1", "q2"]);
  await page.getByRole("button", { name: "Check answers" }).click();
  // 4 of 6 is above the pass mark: passed, and "Try again" is still offered.
  await expect(page.getByRole("status").filter({ hasText: "points" })).toContainText(`4 / ${HEISSEN.items.length} points`);
  await expect(item(page, "q1")).toContainText("✗ Not quite");
  await expect(item(page, "q1").locator("[data-rule-fallback]")).toContainText("Why? The rule:");
  await expect(item(page, "q1").locator("[data-rule-fallback]")).toHaveAttribute("open", "");
  await expect(item(page, "q1")).toContainText("Correct answer:");
  await expect(item(page, "q2").locator("[data-rule-fallback]")).toHaveCount(0);
  await expect(item(page, "q3").locator("[data-rule-fallback]")).toHaveCount(0);
  await expectNoHorizontalOverflow(page, "exercise feedback");

  // Try again: the four right answers stay (locked), the two wrong ones are empty.
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("[data-item][data-kept]")).toHaveCount(4);
  await expect(item(page, "q3")).toContainText("✓ Correct · kept");
  await expect(item(page, "q3").getByRole("textbox")).toBeDisabled();
  await expect(item(page, "q3").getByRole("textbox")).toHaveValue(HEISSEN.items[2].accepted[0]);
  await expect(item(page, "q1").getByRole("textbox")).toHaveValue("");
  await expect(item(page, "q1").getByRole("textbox")).toBeFocused();
  await expect(page.getByText("4 of 6 answered · 4 right answers kept")).toBeVisible();
  await expect(page.getByRole("button", { name: "Check answers" })).toBeDisabled();
  await item(page, "q1").getByRole("textbox").fill(HEISSEN.items[0].accepted[0]);
  await item(page, "q2").getByRole("textbox").fill(HEISSEN.items[1].accepted[0]);
  await page.getByRole("button", { name: "Check answers" }).click();
  // The whole exercise is graded again: full points.
  await expect(page.getByRole("status").filter({ hasText: "points" })).toContainText(`${HEISSEN.items.length} / ${HEISSEN.items.length} points (100%)`);

  // A reading exercise: wrong answers get the correct answer, never an invented rule.
  const lesen = MODULE_1.lessons[1].blocks.find((b) => b.exercise === LESEN.slug);
  await page.goto(`/learn/a1/hallo/ich-heisse?block=${lesen.key}`);
  await answer(page, LESEN, { wrong: true });
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText(/Try again!/)).toBeVisible();
  await expect(page.locator("[data-rule-fallback]")).toHaveCount(0);

  // Back to the topic: results are in, and the way back works.
  await page.goto(heissenUrl);
  await page.getByTestId("return-link").click();
  await expect(page).toHaveURL(new RegExp(`${topicPath}$`));
  await expect(page.locator("[data-topic-exercise]").first()).toHaveAttribute("data-status", "perfect");
});

test("guest: a weak topic shows on the dashboard, in Practice and in Review, and leads to its practice", async ({ page }) => {
  await page.goto(heissenUrl);
  await answer(page, HEISSEN, { wrong: true });
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText(/Try again!/)).toBeVisible();
  // Try again after everything was wrong keeps nothing.
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("[data-item][data-kept]")).toHaveCount(0);

  await page.goto("/dashboard");
  const weak = page.getByTestId("dashboard-weak-topics");
  await expect(weak).toContainText("Needs practice");
  await expect(weak).toContainText("in the one exercise you did");
  await page.goto("/review");
  await expect(page.getByTestId("review-weak-topics")).toContainText("Needs practice");
  await page.goto("/practice/a1");
  await expect(page.getByTestId("weak-topics")).toBeVisible();
  await page.getByTestId("weak-topics").getByRole("link").first().click();
  await expect(page).toHaveURL(new RegExp(`${topicPath}$`));
  await expect(page.getByTestId("practise-now")).toHaveText("Practise your mistakes");
});

test("guest: word topics in both directions; the direction is remembered", async ({ page }) => {
  await page.goto("/practice/a1#words");
  await page.locator('[data-word-topic="zahlen"]').click();
  await expect(page).toHaveURL(/\/practice\/a1\/words\/zahlen$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zahlen");
  await expectNoHorizontalOverflow(page, "word topic");

  // German → English (default): the word shows, the meaning after "Show meaning".
  const card = page.locator("[data-card]");
  await expect(card).toHaveAttribute("data-direction", "de-en");
  await expect(page.getByTestId("meaning")).toHaveCount(0);
  await page.getByRole("button", { name: "Show meaning" }).click();
  await expect(page.getByTestId("meaning")).toBeVisible();
  await page.getByRole("button", { name: "I knew it" }).click();
  await expect(page.getByText(/^Card 2 of/)).toBeVisible();

  // English → German: the meaning first, the German word only after revealing.
  await page.getByRole("button", { name: "English → German" }).click();
  await expect(page.getByRole("button", { name: "English → German" })).toHaveAttribute("aria-pressed", "true");
  await expect(card).toHaveAttribute("data-direction", "en-de");
  await expect(page.getByTestId("meaning")).toBeVisible();
  await expect(page.getByTestId("answer")).toHaveCount(0);
  await page.getByRole("button", { name: "Show the German word" }).click();
  await expect(page.getByTestId("answer")).toBeVisible();
  await page.getByRole("button", { name: "Not yet" }).click();
  await expect(page.getByText(/^Card 3 of/)).toBeVisible();

  await page.reload();
  await expect(page.locator("[data-card]")).toHaveAttribute("data-direction", "en-de");
  await expect(page.getByRole("button", { name: "English → German" })).toHaveAttribute("aria-pressed", "true");
});

test("signed in: Practice pages, results from the account", async ({ page }) => {
  await register(page);
  await page.goto(topicPath);
  await expect(page.getByTestId("topic-status")).toContainText("Not practised yet");
  await page.getByTestId("practise-now").click();
  await answer(page, HEISSEN);
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByRole("status").filter({ hasText: "points" })).toContainText("(100%)");
  await page.getByRole("link", { name: "Back to grammar practice" }).last().click();
  await expect(page).toHaveURL(new RegExp(`${topicPath}$`));
  await expect(page.getByTestId("topic-status")).toContainText("100% right · 1 of 2 exercises practised");
  await page.goto("/practice/a1/words/begruessung");
  await page.getByRole("button", { name: "Show meaning" }).click();
  await page.getByRole("button", { name: "I knew it" }).click();
  await expect(page.getByText(/^Card 2 of/)).toBeVisible();
});
