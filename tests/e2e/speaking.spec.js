import { test, expect } from "@playwright/test";
import { ensureA1Published, expectNoHorizontalOverflow, register } from "./helpers.js";

// Speaking practice with recording, through the real UI (production build, fake
// microphone from playwright.config.mjs). Recordings are practice only: saved, played
// back to their owner, never scored.

const SPEAKING = "/learn/a1/hallo/ich-heisse?block=vorstellen-sprechen";
const item = (page, id) => page.locator(`[data-item="${id}"]`);

async function rateAll(page) {
  for (const id of ["q1", "q2", "q3"]) await item(page, id).getByLabel("I could say it").check();
}

async function recordTake(page, id, ms = 1500) {
  const box = item(page, id);
  await box.getByRole("button", { name: /Record (your answer|again)/ }).click();
  await expect(box.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.waitForTimeout(ms);
  await box.getByRole("button", { name: "Stop" }).click();
  await expect(box.getByLabel("Your new recording")).toBeVisible();
}

test.beforeAll(async ({ browser }) => {
  await ensureA1Published(browser);
});

test("record, preview, retry, submit, play back and delete a recording", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await register(page);
  await page.goto(SPEAKING);
  await expect(page.getByRole("heading", { name: "Sich vorstellen" })).toBeVisible();
  await expect(page.getByTestId("ai-content-notice")).toContainText("not yet reviewed by a native speaker");
  await expectNoHorizontalOverflow(page, "speaking step");

  // First take, then retry: the preview is replaced by the second take.
  await recordTake(page, "q1");
  const firstUrl = await item(page, "q1").getByLabel("Your new recording").getAttribute("src");
  expect(firstUrl).toMatch(/^blob:/);
  await recordTake(page, "q1");
  const secondUrl = await item(page, "q1").getByLabel("Your new recording").getAttribute("src");
  expect(secondUrl).not.toBe(firstUrl);
  await expectNoHorizontalOverflow(page, "speaking step with preview");

  await rateAll(page);
  const upload = page.waitForResponse((r) => r.url().includes("/api/recordings") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Save" }).click();
  const uploadRes = await upload;
  expect(uploadRes.status()).toBe(201);
  const body = await uploadRes.json();
  // Only an opaque id and public metadata reach the browser.
  expect(Object.keys(body.recording).sort()).toEqual(["createdAt", "durationSec", "id", "kind", "mime", "size"]);
  expect(JSON.stringify(body)).not.toMatch(/recordings\/|storage|gridfs|ownerId/);

  await expect(page.getByText("Saved. Speaking practice is not scored.")).toBeVisible();
  await expect(item(page, "q1").getByText("Recording saved privately to your account.")).toBeVisible();
  await expect(page.getByText(/points|pronunciation score/i)).toHaveCount(0);

  // The owner can play it back later.
  await page.reload();
  const previous = item(page, "q1").getByTestId("previous-recording");
  await expect(previous).toBeVisible();
  const src = await previous.locator("audio").getAttribute("src");
  expect(src).toBe(`/api/media/${body.recording.id}`);
  const own = await page.request.get(src);
  expect(own.status()).toBe(200);
  expect(own.headers()["content-type"]).toMatch(/^audio\//);
  expect(own.headers()["cache-control"]).toContain("no-store");
  expect(own.headers()["content-security-policy"]).toContain("sandbox");
  expect(own.headers()["x-content-type-options"]).toBe("nosniff");

  // Another learner can't.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await register(otherPage);
  expect((await otherPage.request.get(src)).status()).toBe(404);
  await other.close();

  // Delete: gone from the page and from the media route.
  await previous.getByRole("button", { name: "Delete recording" }).click();
  await previous.getByRole("button", { name: "Yes, delete" }).click();
  await expect(item(page, "q1").getByText("Recording deleted.")).toBeVisible();
  expect((await page.request.get(src)).status()).toBe(404);
  await page.reload();
  await expect(item(page, "q1").getByTestId("previous-recording")).toHaveCount(0);
});

test("an upload failure keeps the take and can be retried", async ({ page }) => {
  await register(page);
  await page.goto(SPEAKING);
  await recordTake(page, "q2");
  await rateAll(page);

  await page.route("**/api/recordings**", (route) => route.abort("internetdisconnected"));
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("The recording could not be uploaded. Check your connection and try again.")).toBeVisible();
  await expect(item(page, "q2").getByLabel("Your new recording")).toBeVisible();

  await page.unroute("**/api/recordings**");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(item(page, "q2").getByText("Recording saved privately to your account.")).toBeVisible();
});

test("recording stops automatically at the maximum length", async ({ page }) => {
  // The E2E server runs with RECORDING_MAX_SECONDS=5.
  test.setTimeout(60_000);
  await register(page);
  await page.goto(SPEAKING);
  await item(page, "q3").getByRole("button", { name: "Record your answer" }).click();
  await expect(item(page, "q3").getByText("Recording stopped at the 5-second limit.")).toBeVisible({ timeout: 15_000 });
  await expect(item(page, "q3").getByLabel("Your new recording")).toBeVisible();
});

test("without microphone permission the exercise still works by self-rating", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });
  await register(page);
  await page.goto(SPEAKING);
  await item(page, "q1").getByRole("button", { name: "Record your answer" }).click();
  await expect(item(page, "q1").getByRole("alert")).toContainText("Microphone access was blocked");
  await rateAll(page);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved. Speaking practice is not scored.")).toBeVisible();
});

test("without a microphone or MediaRecorder support, recording is explained, not broken", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Requested device not found", "NotFoundError"));
  });
  await register(page);
  await page.goto(SPEAKING);
  await item(page, "q1").getByRole("button", { name: "Record your answer" }).click();
  await expect(item(page, "q1").getByRole("alert")).toContainText("No microphone was found");

  await page.addInitScript(() => {
    delete window.MediaRecorder;
  });
  await page.reload();
  await expect(item(page, "q1").getByTestId("recorder-unavailable").first()).toContainText("Recording is not supported in this browser");
  await rateAll(page);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved. Speaking practice is not scored.")).toBeVisible();
  await expectNoHorizontalOverflow(page, "speaking without recorder");
});

test("the upload endpoint rejects cross-site, unauthenticated and bogus requests", async ({ page, playwright, baseURL }) => {
  await register(page);
  const bytes = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(60)]);
  const url = "/api/recordings?lessonId=000000000000000000000000&exerciseId=000000000000000000000000&itemId=q1";
  const post = (ctx, headers) => ctx.post(url, { headers: { "Content-Type": "audio/webm", ...headers }, data: bytes });

  expect((await post(page.request, {})).status()).toBe(403); // no Origin
  expect((await post(page.request, { Origin: "https://evil.example" })).status()).toBe(403);
  // Same origin, signed in, but the target does not exist: not found (no probing).
  expect((await post(page.request, { Origin: baseURL })).status()).toBe(404);

  const anon = await playwright.request.newContext({ baseURL });
  expect((await post(anon, { Origin: baseURL })).status()).toBe(401);
  expect((await anon.get("/api/media/000000000000000000000000")).status()).toBe(404);
  await anon.dispose();
});
