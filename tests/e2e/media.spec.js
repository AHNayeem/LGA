import { test, expect } from "@playwright/test";
import { login, register, ADMIN } from "./helpers.js";
import { makeMp3 } from "../helpers/mp3.js";

// CMS Phase 2 through the real admin UI against the production build: upload a recording
// (rejected and accepted files), attach it to a new listening exercise in the editor,
// and check it survives a reload. Learners can't fetch a recording that no published
// exercise uses. Only a fresh draft is touched, so the learner specs keep their content.

const suffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

test("admin uploads a recording and attaches it to a listening exercise", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "admin authoring runs on desktop only");
  test.setTimeout(90_000);
  const s = suffix();
  const title = `Aufnahme ${s}`;
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Media" }).click();
  await expect(page.getByRole("heading", { name: "Media", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Upload media" }).click();

  // A disguised file is rejected by the server's signature check.
  await page.getByLabel("Audio or image file").setInputFiles({ name: "fake.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("<html>not audio</html>") });
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Unsupported file" })).toBeVisible();

  await page.getByLabel("Audio or image file").setInputFiles({ name: "dialog.mp3", mimeType: "audio/mpeg", buffer: Buffer.from(makeMp3({ seconds: 1.5 })) });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page).toHaveURL(/\/admin\/media\/[0-9a-f]{24}\?uploaded=1$/);
  await expect(page.getByRole("status").filter({ hasText: "Uploaded" })).toBeVisible();
  const mediaId = page.url().match(/media\/([0-9a-f]{24})/)[1];
  const preview = await page.request.get(`/api/media/${mediaId}`);
  expect(preview.status()).toBe(200);
  expect(preview.headers()["content-type"]).toBe("audio/mpeg");

  // New listening exercise with one line; attach the recording from the library picker.
  await page.goto("/admin/exercises/new?skill=listening");
  await page.getByLabel("Slug").fill(`hoeren-${s}`);
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(`Hören ${s}`);
  await page.getByLabel("This exercise has a stimulus").check();
  await page.getByRole("button", { name: "+ Add line" }).click();
  await page.getByRole("textbox", { name: "Line 1", exact: true }).fill("Der Zug nach Berlin fährt um neun Uhr.");
  const passage = page.getByTestId("audio-attachment").first();
  await expect(passage.getByTestId("audio-source")).toHaveText("Audio missing");
  await passage.getByRole("button", { name: "Attach a recording" }).click();
  await passage.getByLabel("Search recordings").fill(title);
  await passage.getByRole("button", { name: `Use ${title}` }).click();
  await expect(passage.getByTestId("audio-source")).toHaveText("Native audio attached");

  await page.getByLabel("Question type").selectOption({ label: "Richtig / falsch" });
  await page.getByRole("group", { name: /^Statement/ }).getByLabel("Deutsch *").fill("Der Zug fährt um neun Uhr.");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/exercises\/[0-9a-f]{24}\?created=1$/);

  // After a reload the attachment is still there, and the page shows the audio source.
  await page.reload();
  const saved = page.getByTestId("audio-attachment").first();
  await expect(saved.getByTestId("audio-source")).toHaveText("Native audio attached");
  await expect(saved.getByText(title)).toBeVisible();
  await expect(saved.getByText(/Generated TTS: 0 of 1/)).toBeVisible();

  // The library shows the usage.
  await page.goto(`/admin/media/${mediaId}`);
  await expect(page.getByTestId("media-usage").getByRole("link", { name: `Hören ${s}` })).toBeVisible();

  // A learner can't discover the recording: its exercise is a draft.
  const context = await browser.newContext();
  const learnerPage = await context.newPage();
  await register(learnerPage);
  expect((await learnerPage.request.get(`/api/media/${mediaId}`)).status()).toBe(404);
  await context.close();
});
