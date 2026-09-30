import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers.js";

// Bulk vocabulary import through the real admin UI (production build): upload and paste,
// preview with errors and warnings, removing rows, the import itself (progress, no double
// submit), the summary, and a failed import.

const suffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.replace(/[0-9]/g, (d) => "abcdefghij"[d]);

async function openImport(page) {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/admin/vocabulary");
  await page.getByRole("link", { name: "Import words" }).click();
  await expect(page.getByRole("heading", { name: "Import words", level: 1 })).toBeVisible();
}

const previewRow = (page, n) => page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: String(n), exact: true }) });

test.describe("bulk vocabulary import", () => {
  test.skip(({ isMobile }) => isMobile, "admin authoring runs on desktop only");

  test("upload a CSV, fix it in the preview and import it", async ({ page }) => {
    const s = suffix();
    await openImport(page);

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV template" }).click();
    expect((await download).suggestedFilename()).toBe("vocabulary-import-template.csv");

    const csv = [
      "lemma,article,plural,pos,meaning_en,example_de,level,slug",
      `Straße${s},die,die Straßen,noun,street,"Die Straße ist lang, sehr lang.",A1,strasse-${s}`,
      `Tisch${s},,die Tische,noun,table,,A1,tisch-${s}`, // error: noun without article
      `Schloss${s},das,die Schlösser,noun,castle,,A1,schloss-burg-${s}`,
      `Schloss${s},das,die Schlösser,noun,lock,,A1,schloss-tuer-${s}`, // warning: same word as row 4
    ].join("\r\n");
    await page.getByLabel("CSV file").setInputFiles({ name: "woerter.csv", mimeType: "text/csv", buffer: Buffer.from(`﻿${csv}`, "utf-8") });
    await expect(page.getByLabel(/^Data \(paste here/)).toHaveValue(/Straße/);
    await page.getByRole("button", { name: "Preview and check" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Checked 4 rows: 1 error, 1 warning." })).toBeVisible();
    await expect(previewRow(page, 2)).toContainText("Valid");
    await expect(previewRow(page, 3)).toContainText("Nouns need an article");
    await expect(previewRow(page, 5)).toContainText(`Same word as row 4 (das Schloss${s})`);
    const importButton = page.getByRole("button", { name: /^Import 4 words as drafts$/ });
    await expect(importButton).toBeDisabled();

    // Removed rows leave the list and can be restored from the "Removed" filter.
    await page.getByRole("button", { name: "Remove row 3" }).click();
    await expect(previewRow(page, 3)).toHaveCount(0);
    await page.getByLabel("Show").selectOption("removed");
    await expect(page.getByRole("button", { name: "Restore row 3" })).toBeVisible();
    await page.getByLabel("Show").selectOption("all");

    // Slow the import down to see the progress state, and make sure a second click sends nothing.
    let commits = 0;
    await page.route("**/api/admin/vocabulary/import?mode=commit", async (route) => {
      commits++;
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    const button = page.getByRole("button", { name: /^Import 3 words as drafts$/ });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByRole("button", { name: "Importing…" })).toBeDisabled();
    await expect(page.getByRole("status").filter({ hasText: "Importing 3 words…" })).toBeVisible();
    await page.getByRole("button", { name: "Importing…" }).click({ force: true }).catch(() => {});

    await expect(page.getByRole("heading", { name: "Import completed" })).toBeVisible();
    expect(commits).toBe(1);
    const stat = (label) => page.getByRole("definition").filter({ has: page.locator(`xpath=preceding-sibling::dt[1][normalize-space()="${label}"]`) });
    await expect(page.getByText("3 words imported as drafts.")).toBeVisible();
    await expect(stat("Imported")).toHaveText("3");
    await expect(stat("Removed before import (skipped)")).toHaveText("1");
    await expect(stat("Failed")).toHaveText("0");
    await expect(stat("Imported with a duplicate warning")).toHaveText("1");

    await page.goto(`/admin/vocabulary?q=${s}`);
    await expect(page.getByRole("row", { name: new RegExp(`die Straße${s}`) })).toHaveCount(1);
    await expect(page.getByRole("row", { name: new RegExp(`das Schloss${s}`) })).toHaveCount(2);
    await expect(page.getByRole("row", { name: new RegExp(`die Straße${s}`) }).getByText("draft", { exact: true })).toBeVisible();
  });

  test("paste rows from a spreadsheet; a failed import keeps the data", async ({ page }) => {
    const s = suffix();
    await openImport(page);
    await page.getByLabel("Level").selectOption("A1");
    // Tab-separated, no header row: template column order (lemma, article, plural, pos, meaning_en).
    const pasted = [`Fenster${s}\tdas\tdie Fenster\tnoun\twindow`, `laufen${s}\t\t\tverb\tto run`].join("\n");
    await page.getByLabel(/^Data \(paste here/).fill(pasted);
    await page.getByRole("button", { name: "Preview and check" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Checked 2 rows: 0 errors, 0 warnings." })).toBeVisible();
    await expect(page.getByText("(no header row: template column order)")).toBeVisible();
    await expect(previewRow(page, 1)).toContainText(`fenster${s}`);

    // Editing the data invalidates the check.
    await page.getByLabel(/^Data \(paste here/).fill(`${pasted}\n`);
    await expect(page.getByRole("button", { name: /^Import 2 words as drafts$/ })).toBeDisabled();
    await page.getByRole("button", { name: "Check again" }).click();

    await page.route("**/api/admin/vocabulary/import?mode=commit", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, code: "INTERNAL", message: "Something went wrong. Please try again." }) }));
    await page.getByRole("button", { name: /^Import 2 words as drafts$/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Something went wrong" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Import completed" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Import 2 words as drafts$/ })).toBeEnabled();

    await page.unroute("**/api/admin/vocabulary/import?mode=commit");
    await page.getByRole("button", { name: /^Import 2 words as drafts$/ }).click();
    await expect(page.getByRole("heading", { name: "Import completed" })).toBeVisible();
    await page.getByRole("button", { name: "Import more words" }).click();

    // The same rows again: now their slugs exist, so they are errors and can be exported.
    await page.getByLabel(/^Data \(paste here/).fill(pasted);
    await page.getByRole("button", { name: "Preview and check" }).click();
    await expect(previewRow(page, 1)).toContainText(`A word with slug "fenster${s}" already exists in A1`);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download rows with problems" }).click();
    expect((await download).suggestedFilename()).toBe("vocabulary-import-problems.csv");
  });
});
