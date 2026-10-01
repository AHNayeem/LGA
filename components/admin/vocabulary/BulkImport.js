"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDelimited } from "@/lib/content/csv";
import { IMPORT_COLUMN_KEYS, IMPORT_LIMITS, readImportSource, templateRows } from "@/lib/content/vocabularyImport";
import { SOURCE_TYPE_OPTIONS } from "@/lib/content/constants";
import Alert from "@/components/ui/Alert";

// Bulk vocabulary import: upload or paste → preview → remove rows / fix the source →
// validate again → import → summary. The browser only reads the data (parser, header,
// limits). Every rule and duplicate check runs on the server, for the preview and again
// for the import (POST /api/admin/vocabulary/import, lib/http/vocabularyImport.js).
//
// Row numbers are the spreadsheet's row numbers (the header is row 1), so a message can be
// found in Excel or the CSV file.

const ENDPOINT = "/api/admin/vocabulary/import";
const PAGE = 200;
const mb = (bytes) => Math.round(bytes / 1048576);
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`;

const STATUS = {
  valid: { label: "Valid", icon: "✓", className: "text-success-700" },
  warning: { label: "Warning", icon: "⚠", className: "text-warning-700" },
  error: { label: "Error", icon: "✕", className: "text-danger-700" },
};

const button = "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const primary = `${button} bg-brand-600 text-white hover:bg-brand-700`;
const secondary = `${button} border border-line bg-surface hover:bg-canvas`;
const input = "h-8 rounded-md border border-line bg-surface px-2 text-[13px] shadow-xs focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Rows with their messages as CSV, in import format, so they can be fixed and imported again.
function problemsCsv(rows) {
  return formatDelimited([["row", "error", ...IMPORT_COLUMN_KEYS], ...rows.map((r) => [r.row, r.messages.join(" "), ...IMPORT_COLUMN_KEYS.map((k) => r.values?.[k] ?? "")])]);
}

async function post(mode, body) {
  const json = JSON.stringify(body);
  if (new Blob([json]).size > IMPORT_LIMITS.maxBytes) {
    return { ok: false, message: `This import is larger than ${mb(IMPORT_LIMITS.maxBytes)} MB. Split it into several imports.` };
  }
  try {
    const res = await fetch(`${ENDPOINT}?mode=${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: json });
    const data = await res.json().catch(() => null);
    return data ?? { ok: false, message: `The server answered with an error (${res.status}). Please try again.` };
  } catch {
    return { ok: false, message: "The server could not be reached. Check your connection and try again." };
  }
}

function requestBody(rows, defaults) {
  const columns = IMPORT_COLUMN_KEYS.filter((k) => rows.some((r) => r.values[k]));
  return { defaults, columns: columns.length ? columns : ["lemma"], rows: rows.map((r) => [r.row, ...columns.map((c) => r.values[c] ?? "")]) };
}

export default function BulkImport({ levels }) {
  const ids = { source: useId(), file: useId(), level: useId(), sourceType: useId(), sourceRef: useId(), filter: useId() };
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [defaults, setDefaults] = useState({ levelCode: "", sourceType: SOURCE_TYPE_OPTIONS[0].value, sourceReference: "" });
  const [parsed, setParsed] = useState(null); // readImportSource() result + the source it was read from
  const [preview, setPreview] = useState(null); // { key, totals, byRow: Map }
  const [removed, setRemoved] = useState(() => new Set());
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE);
  const [phase, setPhase] = useState("idle"); // idle | checking | importing | done
  const [message, setMessage] = useState(null); // { tone, text }
  const [result, setResult] = useState(null);
  const busy = useRef(false);
  const fileRef = useRef(null);

  const stale = preview && preview.key !== JSON.stringify([source, defaults]);

  // Every row of the data: readable rows with their server result, and unreadable ones.
  const rows = useMemo(() => {
    if (!parsed) return [];
    const out = parsed.rows.map((r) => {
      const view = preview?.byRow.get(r.row);
      return { row: r.row, values: r.values, status: view?.status ?? null, slug: view?.slug ?? null, levelCode: view?.levelCode ?? null, errors: view?.errors ?? [], warnings: view?.warnings ?? [] };
    });
    for (const [row, errors] of Object.entries(parsed.rowErrors)) out.push({ row: Number(row), values: null, status: "error", errors, warnings: [], unreadable: true });
    return out.sort((a, b) => a.row - b.row);
  }, [parsed, preview]);

  const active = rows.filter((r) => !removed.has(r.row));
  const counts = {
    all: active.length,
    error: active.filter((r) => r.status === "error").length,
    warning: active.filter((r) => r.status === "warning").length,
    valid: active.filter((r) => r.status === "valid").length,
    removed: rows.length - active.length,
  };
  const shown = filter === "removed" ? rows.filter((r) => removed.has(r.row)) : filter === "all" ? active : active.filter((r) => r.status === filter);
  const canImport = preview && !stale && phase !== "importing" && phase !== "checking" && counts.all > 0 && counts.error === 0 && active.every((r) => r.status);

  function resetResults() {
    setPreview(null);
    setResult(null);
    setMessage(null);
    if (phase === "done") setPhase("idle");
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    resetResults();
    if (file.size > IMPORT_LIMITS.maxBytes) {
      setMessage({ tone: "error", text: `${file.name} is larger than ${mb(IMPORT_LIMITS.maxBytes)} MB. Split it into several imports.` });
      return;
    }
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      setSource(text);
      setFileName(file.name);
      setParsed(null);
      setRemoved(new Set());
    } catch {
      setMessage({ tone: "error", text: `${file.name} is not UTF-8 text. In Excel, save it as "CSV UTF-8 (comma delimited)" and upload it again.` });
    }
  }

  // Reads the data and asks the server to check it (nothing is saved).
  async function check() {
    if (busy.current) return;
    const read = readImportSource(source);
    const keepRemoved = parsed?.source === source;
    const nextRemoved = keepRemoved ? removed : new Set();
    setParsed({ ...read, source });
    setRemoved(nextRemoved);
    setResult(null);
    setFilter("all");
    setVisible(PAGE);
    if (read.errors.length) {
      setPreview(null);
      setMessage({ tone: "error", text: read.errors.join(" ") });
      return;
    }
    const send = read.rows.filter((r) => !nextRemoved.has(r.row));
    if (send.length === 0) {
      setPreview(null);
      setMessage({ tone: "error", text: Object.keys(read.rowErrors).length ? "No row could be read. Fix the rows listed below." : "There are no rows to check." });
      return;
    }
    busy.current = true;
    setPhase("checking");
    setMessage(null);
    const res = await post("preview", requestBody(send, defaults));
    busy.current = false;
    setPhase("idle");
    if (!res.ok) {
      setPreview(null);
      setMessage({ tone: "error", text: res.message });
      return;
    }
    setPreview({ key: JSON.stringify([source, defaults]), totals: res.data.totals, byRow: new Map(res.data.rows.map((r) => [r.row, r])) });
    const { errors, warnings } = res.data.totals;
    setMessage({
      tone: errors ? "error" : warnings ? "warning" : "success",
      text: `Checked ${plural(res.data.totals.total, "row")}: ${plural(errors, "error")}, ${plural(warnings, "warning")}.${errors ? " Remove or fix the rows with errors before importing." : ""}`,
    });
  }

  async function runImport() {
    if (busy.current || !canImport) return;
    busy.current = true;
    setPhase("importing");
    setMessage(null);
    const send = active.map((r) => ({ row: r.row, values: r.values }));
    const res = await post("commit", requestBody(send, defaults));
    busy.current = false;
    if (!res.ok) {
      setPhase("idle");
      // The server found errors (e.g. a word added meanwhile): show them on the rows.
      const rowErrors = Object.entries(res.fieldErrors ?? {}).filter(([k]) => k.startsWith("row."));
      if (rowErrors.length && preview) {
        const byRow = new Map(preview.byRow);
        for (const [k, errors] of rowErrors) {
          const row = Number(k.slice(4));
          byRow.set(row, { ...(byRow.get(row) ?? { row }), status: "error", errors });
        }
        setPreview({ ...preview, byRow });
        setFilter("error");
      }
      setMessage({ tone: "error", text: res.message });
      return;
    }
    setResult({ ...res.data, sent: send, removed: counts.removed, rowsInData: rows.length });
    setPhase("done");
  }

  function clearAll() {
    if (busy.current) return;
    setSource("");
    setFileName("");
    setParsed(null);
    setRemoved(new Set());
    setFilter("all");
    setPhase("idle");
    resetResults();
    if (fileRef.current) fileRef.current.value = "";
  }

  const toggleRow = (row) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  const removeAll = (status) => setRemoved((prev) => new Set([...prev, ...active.filter((r) => r.status === status).map((r) => r.row)]));
  const problemRows = active.filter((r) => r.status === "error" || r.status === "warning").map((r) => ({ ...r, messages: [...r.errors, ...r.warnings] }));

  if (phase === "done" && result) return <Summary result={result} onReset={clearAll} />;

  return (
    <div className="mt-6 space-y-6">
      <section aria-labelledby={`${ids.source}-h`} className="space-y-4 rounded-lg border border-line bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id={`${ids.source}-h`} className="font-semibold">
              1. Data
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Upload a CSV file (UTF-8, comma or semicolon separated) or paste rows copied from Excel or Google Sheets. A header row is optional: without one, the
              columns are read in template order. At most {IMPORT_LIMITS.maxRows.toLocaleString("en")} rows and {mb(IMPORT_LIMITS.maxBytes)} MB per import.
            </p>
          </div>
          <button type="button" className={secondary} onClick={() => download("vocabulary-import-template.csv", formatDelimited(templateRows()))}>
            Download CSV template
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.file} className="text-xs font-medium">
            CSV file
          </label>
          <input
            ref={fileRef}
            id={ids.file}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onChange={onFile}
            disabled={phase === "importing"}
            className="text-sm file:mr-3 file:h-8 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.source} className="text-xs font-medium">
            Data (paste here, or edit the uploaded file){fileName ? ` · from ${fileName}` : ""}
          </label>
          <textarea
            id={ids.source}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setResult(null);
            }}
            rows={8}
            spellCheck={false}
            disabled={phase === "importing"}
            aria-describedby={`${ids.source}-hint`}
            placeholder={"lemma\tarticle\tplural\tpos\tmeaning_en\nHaus\tdas\tdie Häuser\tnoun\thouse"}
            className="w-full rounded-md border border-line bg-surface p-2 font-mono text-xs focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <p id={`${ids.source}-hint`} className="text-xs text-ink-muted">
            Fix mistakes here (or in your spreadsheet and paste again), then check the data again.
          </p>
        </div>
      </section>

      <section aria-labelledby={`${ids.level}-h`} className="space-y-3 rounded-lg border border-line bg-surface p-4 shadow-xs">
        <h2 id={`${ids.level}-h`} className="font-semibold">
          2. Defaults for empty cells
        </h2>
        <p className="max-w-2xl text-sm text-ink-muted">Used only where a row leaves the level or source columns empty. A value in the row always wins.</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.level} className="text-xs font-medium">
              Level
            </label>
            <select id={ids.level} className={input} value={defaults.levelCode} onChange={(e) => setDefaults({ ...defaults, levelCode: e.target.value })}>
              <option value="">None: every row needs a level</option>
              {levels.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.sourceType} className="text-xs font-medium">
              Source type
            </label>
            <select id={ids.sourceType} className={input} value={defaults.sourceType} onChange={(e) => setDefaults({ ...defaults, sourceType: e.target.value })}>
              {SOURCE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-64 flex-1 flex-col gap-1">
            <label htmlFor={ids.sourceRef} className="text-xs font-medium">
              Source reference
            </label>
            <input id={ids.sourceRef} className={input} value={defaults.sourceReference} maxLength={500} onChange={(e) => setDefaults({ ...defaults, sourceReference: e.target.value })} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primary} onClick={check} disabled={!source.trim() || phase === "checking" || phase === "importing"}>
          {phase === "checking" ? "Checking…" : preview ? "Check again" : "Preview and check"}
        </button>
        <button type="button" className={secondary} onClick={clearAll} disabled={phase === "importing" || (!source && !parsed)}>
          Clear
        </button>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        {stale && !message && <Alert tone="warning">The data or the defaults changed since the last check. Check again before importing.</Alert>}
      </div>

      {parsed && rows.length > 0 && (
        <section aria-labelledby={`${ids.filter}-h`} className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id={`${ids.filter}-h`} className="font-semibold">
                3. Preview
              </h2>
              <p className="text-sm text-ink-muted">
                {plural(rows.length, "row")} read{parsed.hasHeader ? " (header in row 1)" : " (no header row: template column order)"} ·{" "}
                <span className="text-success-700">{plural(counts.valid, "valid row")}</span> · <span className="text-warning-700">{plural(counts.warning, "warning")}</span> ·{" "}
                <span className="text-danger-700">{plural(counts.error, "error")}</span> · {plural(counts.removed, "removed row")}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor={ids.filter} className="text-xs font-medium">
                  Show
                </label>
                <select
                  id={ids.filter}
                  className={input}
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setVisible(PAGE);
                  }}
                >
                  <option value="all">All rows ({counts.all})</option>
                  <option value="error">Errors ({counts.error})</option>
                  <option value="warning">Warnings ({counts.warning})</option>
                  <option value="valid">Valid ({counts.valid})</option>
                  <option value="removed">Removed ({counts.removed})</option>
                </select>
              </div>
              <button type="button" className={secondary} onClick={() => removeAll("error")} disabled={counts.error === 0 || phase === "importing"}>
                Remove all rows with errors
              </button>
              <button type="button" className={secondary} onClick={() => removeAll("warning")} disabled={counts.warning === 0 || phase === "importing"}>
                Remove all rows with warnings
              </button>
              <button type="button" className={secondary} onClick={() => download("vocabulary-import-problems.csv", problemsCsv(problemRows))} disabled={problemRows.length === 0}>
                Download rows with problems
              </button>
            </div>
          </div>

          <PreviewTable rows={shown.slice(0, visible)} removed={removed} onToggle={toggleRow} disabled={phase === "importing"} />
          {shown.length > visible && (
            <button type="button" className={secondary} onClick={() => setVisible((v) => v + PAGE * 5)}>
              Show more rows ({(shown.length - visible).toLocaleString("en")} not shown)
            </button>
          )}

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <button type="button" className={primary} onClick={runImport} disabled={!canImport} aria-describedby={`${ids.filter}-import-hint`}>
              {phase === "importing" ? "Importing…" : `Import ${plural(counts.all, "word")} as drafts`}
            </button>
            <p id={`${ids.filter}-import-hint`} className="text-xs text-ink-muted">
              {phase === "importing"
                ? "Please keep this page open."
                : !preview || stale
                  ? "Check the data first."
                  : counts.error
                    ? `Remove or fix the ${plural(counts.error, "row")} with errors first.`
                    : `New words are drafts: review and publish them afterwards.${counts.removed ? ` ${plural(counts.removed, "removed row")} will be skipped.` : ""}`}
            </p>
            {phase === "importing" && (
              <div role="status" className="flex items-center gap-2 text-sm">
                <progress className="h-2 w-40" aria-label="Import progress" />
                Importing {plural(counts.all, "word")}…
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function PreviewTable({ rows, removed, onToggle, disabled }) {
  if (rows.length === 0) return <p className="rounded-lg border border-dashed border-line-strong bg-surface p-4 text-sm text-ink-muted">No rows to show.</p>;
  return (
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[900px] text-left text-sm">
        <caption className="sr-only">Import preview. Row numbers are the rows of your spreadsheet.</caption>
        <thead className="sticky top-0 border-b border-line bg-surface text-xs uppercase text-ink-muted">
          <tr>
            {["Row", "Status", "Word", "Type", "Level", "Meaning (en)", "Slug", "Messages", ""].map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2 font-medium">
                {h || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isRemoved = removed.has(r.row);
            const s = STATUS[r.status];
            const v = r.values ?? {};
            return (
              <tr key={r.row} className={`border-b border-line align-top last:border-0 ${isRemoved ? "text-ink-muted line-through" : ""}`}>
                <th scope="row" className="px-3 py-2 font-mono text-xs font-normal tabular-nums">
                  {r.row}
                </th>
                <td className={`whitespace-nowrap px-3 py-2 font-medium ${s?.className ?? "text-ink-muted"}`}>
                  {s ? (
                    <>
                      <span aria-hidden="true">{s.icon}</span> {s.label}
                    </>
                  ) : (
                    "Not checked"
                  )}
                </td>
                <td className="px-3 py-2" lang="de">
                  {r.unreadable ? <em className="text-ink-muted">unreadable row</em> : [v.article, v.lemma].filter(Boolean).join(" ") || <em className="text-ink-muted">empty</em>}
                  {v.plural && <span className="ml-1 text-xs text-ink-muted">· {v.plural}</span>}
                </td>
                <td className="px-3 py-2 text-xs">{v.pos}</td>
                <td className="px-3 py-2 text-xs">{r.levelCode ?? v.level}</td>
                <td className="px-3 py-2">{v.meaning_en}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.slug ?? v.slug}</td>
                <td className="px-3 py-2 text-xs">
                  {(r.errors.length > 0 || r.warnings.length > 0) && (
                    <ul className="space-y-0.5">
                      {r.errors.map((m) => (
                        <li key={m} className="text-danger-700">
                          {m}
                        </li>
                      ))}
                      {r.warnings.map((m) => (
                        <li key={m} className="text-warning-700">
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onToggle(r.row)}
                    disabled={disabled}
                    aria-label={`${isRemoved ? "Restore" : "Remove"} row ${r.row}`}
                    className="rounded-md border border-line px-2 py-1 text-xs no-underline hover:bg-canvas disabled:opacity-60"
                  >
                    {isRemoved ? "Restore" : "Remove"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Summary({ result, onReset }) {
  const byRow = new Map(result.sent.map((r) => [r.row, r.values]));
  const failedRows = result.failed.map((f) => ({ row: f.row, values: byRow.get(f.row), messages: [f.message] }));
  const stats = [
    ["Rows in the data", result.rowsInData],
    ["Imported", result.imported.length],
    ["Removed before import (skipped)", result.removed],
    ["Failed", result.failed.length],
    ["Imported with a duplicate warning", result.totals.warnings],
  ];
  return (
    <section aria-labelledby="import-summary" className="mt-6 space-y-4">
      <Alert tone={result.failed.length ? "warning" : "success"}>
        <h2 id="import-summary" className="font-semibold">
          {result.failed.length ? "Import finished with failures" : "Import completed"}
        </h2>
        <p className="mt-1">
          {plural(result.imported.length, "word")} imported as drafts. They are invisible to learners until they are reviewed, approved and published.
        </p>
      </Alert>
      <dl className="grid max-w-xl grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-lg border border-line bg-surface p-4 shadow-xs text-sm">
        {stats.map(([label, n]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{n.toLocaleString("en")}</dd>
          </div>
        ))}
      </dl>
      {failedRows.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Failed rows</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-danger-700">
            {failedRows.slice(0, 20).map((f) => (
              <li key={f.row}>
                Row {f.row}: {f.messages[0]}
              </li>
            ))}
          </ul>
          {failedRows.length > 20 && <p className="text-sm text-ink-muted">…and {failedRows.length - 20} more in the download.</p>}
          <button type="button" className={secondary} onClick={() => download("vocabulary-import-failed.csv", problemsCsv(failedRows))}>
            Download failed rows (CSV)
          </button>
        </div>
      )}
      <p className="text-xs text-ink-muted">Import id: {result.importId}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/vocabulary?review=draft" className={primary}>
          Review the new drafts
        </Link>
        <button type="button" className={secondary} onClick={onReset}>
          Import more words
        </button>
      </div>
    </section>
  );
}
