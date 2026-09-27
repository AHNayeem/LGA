import { expect } from "@playwright/test";

export const ADMIN = { email: "admin@e2e.test", password: "e2e-admin-password" };

export const uniqueEmail = () => `learner-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;

export async function register(page, { name = "Lena Schäfer", email = uniqueEmail(), password = "sicheres-passwort" } = {}) {
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return { name, email, password };
}

export async function login(page, email, password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signOut(page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
}

// Walks the A1 level through review and publishing in the admin UI. Tolerates reruns
// against the same server (another test or project may already have published it).
export async function publishA1ViaAdmin(page) {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: "Content administration" })).toBeVisible();
  const row = page.getByRole("table").first().getByRole("row", { name: /A1/ });
  for (const [label, status] of [
    ["Mark reviewed", "reviewed"],
    ["Approve", "approved"],
  ]) {
    const button = row.getByRole("button", { name: label, exact: true });
    if (await button.isVisible()) {
      await button.click();
      await expect(row.getByText(status, { exact: true })).toBeVisible();
    }
  }
  const publish = row.getByRole("button", { name: "Publish", exact: true });
  if (await publish.isVisible()) await publish.click();
  await expect(row.getByText("published", { exact: true })).toBeVisible();
  return row;
}

export async function ensureA1Published(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await publishA1ViaAdmin(page);
  await ctx.close();
}
