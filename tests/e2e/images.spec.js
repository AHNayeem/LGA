import { test, expect } from "@playwright/test";
import { login, register, ADMIN } from "./helpers.js";
import { makePng, SVG } from "../helpers/images.js";

// CMS Phase 5 through the real UI against the production build: an SVG is rejected, a
// PNG is uploaded in the media library, attached to the intro block of a draft lesson
// (alt text required, prefilled from the library), and rendered by "Preview as learner"
// with its alt text and caption, on desktop and at phone width. Learners can't fetch the
// image or open the draft. The lesson lives in a fresh draft module, so Module 1 and the
// other specs stay untouched. Published learner rendering uses the same components and
// data (tests/integration/curriculum-images.test.js).

const suffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const NOT_FOUND_HEADING = "Seite nicht gefunden";

test("admin uploads an image, attaches it to a lesson and sees it in the learner preview", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "admin authoring runs on desktop only");
  test.setTimeout(120_000);
  const s = suffix();
  const imageTitle = `Bild ${s}`;
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  // Upload: SVG is refused on the server, a real PNG is accepted.
  await page.goto("/admin/media");
  await page.getByRole("link", { name: "Upload media" }).click();
  await expect(page.getByRole("heading", { name: "Upload media", level: 1 })).toBeVisible();
  const file = page.getByLabel("Audio or image file");
  await file.setInputFiles({ name: "logo.svg", mimeType: "image/svg+xml", buffer: Buffer.from(SVG) });
  await page.getByLabel("Title").fill(imageTitle);
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Unsupported file" })).toBeVisible();

  await file.setInputFiles({ name: "gruss.png", mimeType: "image/png", buffer: Buffer.from(makePng({ width: 64, height: 48, rgb: [30, 120, 200] })) });
  await page.getByLabel("Default alt text, English (optional)").fill("Two people waving hello");
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page).toHaveURL(/\/admin\/media\/[0-9a-f]{24}\?uploaded=1$/);
  const mediaId = page.url().match(/media\/([0-9a-f]{24})/)[1];
  await expect(page.getByText("64×48")).toBeVisible();
  await expect(page.getByText("Own image").first()).toBeVisible();
  await page.goto("/admin/media?kind=image");
  await expect(page.getByRole("link", { name: imageTitle })).toBeVisible();

  // A draft module and a draft lesson whose intro block shows the image.
  const moduleTitle = `Bild-Modul ${s}`;
  await page.goto("/admin/modules/new");
  await page.getByLabel("Level").selectOption("A1");
  await page.getByLabel("Slug").fill(`bild-modul-${s}`);
  await page.getByLabel("Order").fill("91");
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(moduleTitle);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/modules\/[0-9a-f]{24}\/edit\?created=1$/);

  const lessonTitle = `Bildlektion ${s}`;
  await page.goto("/admin/lessons/new");
  await page.getByLabel("Module").selectOption({ label: `A1 · ${moduleTitle}` });
  await page.getByLabel("Slug").fill(`bild-${s}`);
  await page.getByRole("group", { name: /^Title/ }).getByLabel("Deutsch *").fill(lessonTitle);
  await page.getByLabel("New block type").selectOption("intro");
  await page.getByRole("button", { name: "+ Add block" }).click();
  const intro = page.getByTestId("lesson-block").last();
  await intro.getByRole("group", { name: /^Text/ }).getByLabel("English").fill("Look at the picture.");
  const attachment = intro.getByTestId("image-attachment");
  await attachment.getByRole("button", { name: "Add an image" }).click();
  await attachment.getByLabel("Search images").fill(imageTitle);
  await attachment.getByRole("button", { name: `Use ${imageTitle}` }).click();
  const alt = attachment.getByRole("group", { name: /^Alt text/ });
  await expect(alt.getByLabel("English")).toHaveValue("Two people waving hello"); // prefilled

  // Alt text is required: the server rejects an empty one next to the field.
  await alt.getByLabel("English").fill("");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(alt.getByText("At least one language is required")).toBeVisible();
  await alt.getByLabel("English").fill("Two people waving hello");
  await alt.getByLabel("Deutsch").fill("Zwei Menschen winken");
  await attachment.getByRole("group", { name: /^Caption/ }).getByLabel("English").fill("Hello!");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/lessons\/[0-9a-f]{24}\?created=1$/);
  const lessonId = page.url().match(/lessons\/([0-9a-f]{24})/)[1];

  // Still attached after a reload, with its preview.
  await page.reload();
  const saved = page.getByTestId("lesson-block").first().getByTestId("image-attachment");
  await expect(saved.getByText(imageTitle)).toBeVisible();
  await expect(saved.getByRole("group", { name: /^Alt text/ }).getByLabel("Deutsch")).toHaveValue("Zwei Menschen winken");

  // The real learner lesson UI in preview: the image loads, with alt text and caption.
  await page.getByRole("link", { name: "Preview as learner" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/lessons/${lessonId}/preview`));
  const figure = page.getByTestId("content-image");
  const img = figure.getByRole("img", { name: "Two people waving hello" });
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute("src", `/api/media/${mediaId}`);
  await expect(img).toHaveAttribute("width", "64");
  await expect(img).toHaveAttribute("height", "48");
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth)).toBe(64);
  await expect(figure.getByText("Hello!")).toBeVisible();
  await expect(page.getByText("Look at the picture.")).toBeVisible();

  // Phone width: the image scales down with its aspect ratio and the page doesn't scroll sideways.
  await page.setViewportSize({ width: 360, height: 740 });
  await page.reload();
  const box = await page.getByTestId("content-image").getByRole("img").boundingBox();
  expect(box.width).toBeLessThanOrEqual(360);
  expect(Math.abs(box.width / box.height - 64 / 48)).toBeLessThan(0.05);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // The media library shows where the image is used.
  await page.goto(`/admin/media/${mediaId}`);
  await expect(page.getByTestId("media-usage").getByRole("link", { name: lessonTitle })).toBeVisible();

  // Learners can neither load the draft's image nor open the draft.
  const ctx = await browser.newContext();
  const learner = await ctx.newPage();
  await register(learner);
  expect((await learner.request.get(`/api/media/${mediaId}`)).status()).toBe(404);
  await learner.goto(`/learn/a1/bild-modul-${s}/bild-${s}`);
  await expect(learner.getByRole("heading", { name: NOT_FOUND_HEADING })).toBeVisible();
  await learner.goto(`/admin/lessons/${lessonId}/preview`);
  await expect(learner).toHaveURL(/\/dashboard\?error=forbidden/);
  await ctx.close();
});
