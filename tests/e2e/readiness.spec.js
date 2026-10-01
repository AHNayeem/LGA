import { test, expect } from "@playwright/test";
import { ensureA1Published, login, register, ADMIN } from "./helpers.js";
import { MODULE_1 } from "../../content/curriculum/a1/module-01/index.js";

// The read-only curriculum readiness page (/admin/readiness, not linked from the admin
// navigation yet). In the E2E database Module 1 is published with test-fixture approvals,
// so its lessons are live but still "need review"; modules 2–12 are not seeded here.

test("admin sees what is live and what still needs review; learners can't open the page", async ({ page, browser }) => {
  await ensureA1Published(browser);
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/readiness");
  await expect(page.getByRole("heading", { name: "Curriculum readiness · A1" })).toBeVisible();
  const hallo = page.locator('[data-module="hallo"]');
  await expect(hallo.getByRole("heading", { name: /Modul 1/ })).toBeVisible();
  // The six seeded lessons (other specs may add draft lessons to the module).
  for (const l of MODULE_1.lessons) await expect(hallo.locator(`[data-lesson="${l.slug}"]`)).toBeVisible();
  // Live, but test-fixture approvals are never "ready".
  for (const l of MODULE_1.lessons) await expect(hallo.locator(`[data-lesson="${l.slug}"]`)).not.toHaveAttribute("data-status", "ready");
  await expect(hallo.getByText("Live", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("readiness-blocked")).toHaveText("0");
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noOverflow).toBe(true);

  const learner = await browser.newContext();
  const lp = await learner.newPage();
  await register(lp);
  await lp.goto("/admin/readiness");
  await expect(lp).toHaveURL(/\/dashboard\?error=forbidden$/);
  await learner.close();
});
