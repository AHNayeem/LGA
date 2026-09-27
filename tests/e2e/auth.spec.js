import { test, expect } from "@playwright/test";

const unique = () => `learner-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;

async function register(page, { name = "Lena Schäfer", email = unique(), password = "sicheres-passwort" } = {}) {
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return { name, email, password };
}

async function signOut(page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function login(page, email, password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("protected pages redirect to login and back", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("register, see dashboard, sign out, sign back in", async ({ page }) => {
  const user = await register(page);
  await expect(page.getByRole("heading", { name: `Hallo, ${user.name}!` })).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  await signOut(page);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
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
  const sent = page.waitForRequest((r) => r.url().endsWith("/dashboard"));
  await page.goto("/dashboard");
  expect(await (await sent).headerValue("cookie")).toContain("__Host-lga_session=");
  // The DAL rejects it; /login must render (no redirect loop back to /dashboard).
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});

test("USER cannot open the admin area", async ({ page }) => {
  await register(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard\?error=forbidden/);
  await expect(page.getByRole("alert").filter({ hasText: "don't have access" })).toBeVisible();
});

test("media requires authentication", async ({ request }) => {
  const res = await request.get("/api/media/64b7f0c2a1b2c3d4e5f60718", { maxRedirects: 0 });
  expect(res.status()).toBe(401);
});

test("admin approves and publishes A1, learner then sees it", async ({ page, browser }) => {
  await login(page, "admin@e2e.test", "e2e-admin-password");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: "Content administration" })).toBeVisible();

  const row = page.getByRole("row", { name: /A1/ });
  // Tolerate reruns against the same seeded server (other projects may have already published).
  if (await row.getByRole("button", { name: "Mark reviewed", exact: true }).isVisible()) {
    await row.getByRole("button", { name: "Mark reviewed", exact: true }).click();
    await expect(row.getByText("reviewed", { exact: true })).toBeVisible();
  }
  if (await row.getByRole("button", { name: "Approve", exact: true }).isVisible()) {
    await row.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(row.getByText("approved", { exact: true })).toBeVisible();
  }
  if (await row.getByRole("button", { name: "Publish", exact: true }).isVisible()) {
    await row.getByRole("button", { name: "Publish", exact: true }).click();
  }
  await expect(row.getByText("published", { exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "Unpublish", exact: true })).toBeVisible();

  const learnerContext = await browser.newContext();
  const learner = await learnerContext.newPage();
  await register(learner);
  await expect(learner.getByText("A1 – Anfänger")).toBeVisible();
  await expect(learner.getByText("No level has been approved and published yet.")).toHaveCount(0);
  await learnerContext.close();
});
