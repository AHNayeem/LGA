import { test, expect } from "@playwright/test";
import { login, publishA1ViaAdmin, register, signOut } from "./helpers.js";


test("protected pages redirect to login and back; learning is open to guests", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await page.goto("/exams/attempts/000000000000000000000000");
  await expect(page).toHaveURL(/\/login\?next=%2Fexams%2Fattempts/);
  // The learner home works without an account.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Willkommen!" })).toBeVisible();
});

test("register, see dashboard, sign out, sign back in", async ({ page }) => {
  const user = await register(page);
  await expect(page.getByRole("heading", { name: `Hallo, ${user.name}!` })).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  await signOut(page);

  // Signed out, the dashboard is the guest home: no account data shows.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Willkommen!" })).toBeVisible();
  await expect(page.getByText(user.name)).toHaveCount(0);
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("shows validation and credential errors", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("X");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("aria-invalid", "true");

  await login(page, "nobody@e2e.test", "wrong-password-123");
  // Next.js adds its own (empty) role="alert" route announcer, so filter by text.
  await expect(page.getByRole("alert").filter({ hasText: "Email or password is incorrect." })).toBeVisible();
});

test("session cookie is HttpOnly and the raw token is not exposed to scripts", async ({ page, context }) => {
  await register(page);
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name.endsWith("lga_session"));
  expect(session).toBeTruthy();
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("lga_session");
});

test("a forged session cookie is rejected server-side", async ({ page, context }) => {
  await context.addCookies([
    // Chrome treats localhost as a secure context, so the Secure __Host- cookie is sent over http.
    { name: "__Host-lga_session", value: "A".repeat(43), url: "https://localhost:3100", httpOnly: true, secure: true },
  ]);
  // Prove the forged cookie is actually sent (otherwise the proxy redirect alone would pass).
  const sent = page.waitForRequest((r) => r.url().endsWith("/admin"));
  await page.goto("/admin");
  expect(await (await sent).headerValue("cookie")).toContain("__Host-lga_session=");
  // The DAL rejects it; /login must render (no redirect loop back to /admin).
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});

test("USER cannot open the admin area", async ({ page }) => {
  await register(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard\?error=forbidden/);
  await expect(page.getByRole("alert").filter({ hasText: "don't have access" })).toBeVisible();
});

test("anonymous media requests only reach published curriculum media (unknown ids are 404)", async ({ request }) => {
  const res = await request.get("/api/media/64b7f0c2a1b2c3d4e5f60718", { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

test("admin approves and publishes A1, learner then sees it", async ({ page, browser }) => {
  const row = await publishA1ViaAdmin(page);
  await expect(row.getByRole("button", { name: "Unpublish", exact: true })).toBeVisible();

  const learnerContext = await browser.newContext();
  const learner = await learnerContext.newPage();
  await register(learner);
  await expect(learner.getByText("A1 – Anfänger").first()).toBeVisible();
  await expect(learner.getByText("No level has been approved and published yet.")).toHaveCount(0);
  await learnerContext.close();
});
