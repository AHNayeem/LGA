import { expect } from "@playwright/test";

export const ADMIN = { email: "admin@e2e.test", password: "e2e-admin-password" };

export const uniqueEmail = () => `learner-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;

// Each registered learner gets its own simulated client IP, so the per-IP registration
// limit (10/hour) doesn't make the suite depend on how many learners it creates.
const randomIp = () => `10.${1 + Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

export async function register(page, { name = "Lena Schäfer", email = uniqueEmail(), password = "sicheres-passwort" } = {}) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
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

const text = (t) => t.de ?? t.en;

// Answers one exercise the way a learner would, using the authored answer key.
export async function answer(page, exercise, { wrong = false } = {}) {
  for (const item of exercise.items) {
    const box = page.locator(`[data-item="${item.id}"]`);
    switch (item.type) {
      case "mcq": {
        const option = wrong ? item.options.find((o) => o.id !== item.answer) : item.options.find((o) => o.id === item.answer);
        await box.getByLabel(text(option.text), { exact: false }).check();
        break;
      }
      case "true_false":
        await box.getByLabel(item.answer !== wrong ? "richtig" : "falsch").check();
        break;
      case "text_input":
        await box.getByRole("textbox").fill(wrong ? "xyz" : item.accepted[0]);
        break;
      case "match": {
        const rights = item.pairs.map((p) => text(p.right));
        for (const [i, p] of item.pairs.entries()) {
          const target = wrong ? rights[(i + 1) % rights.length] : text(p.right);
          await box.getByLabel(text(p.left), { exact: true }).selectOption({ label: target });
        }
        break;
      }
      case "order": {
        const tokens = wrong ? [...item.tokens].reverse() : item.tokens;
        for (const t of tokens) await box.getByRole("group", { name: "Words" }).getByRole("button", { name: t, exact: true }).first().click();
        break;
      }
      case "speak_prompt":
        await box.getByLabel("I could say it").check();
        break;
    }
  }
}

// Phones must never scroll sideways (it also breaks tapping in mobile emulation).
export async function expectNoHorizontalOverflow(page, where) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `horizontal overflow at ${where}`).toBeLessThanOrEqual(clientWidth);
}
