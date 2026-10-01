"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveContentAction } from "@/app/actions/content";
import { editHref } from "@/lib/content/adminSections";
import { ErrorsContext } from "@/components/admin/editor/fields";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/button";

// Wraps an editor form: sends the payload to the server, shows field errors next to the
// inputs (and all of them in a summary), and handles version conflicts. The server
// decides everything: validation, relationships, permissions and the lifecycle result.
export default function EditorShell({ kind, item, buildPayload, children, submitLabel, onSaved }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(null);
  const [version, setVersion] = useState(item?.version ?? null);
  const isNew = !item?.id;
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  function onSubmit(e) {
    e.preventDefault();
    const data = buildPayload();
    startTransition(async () => {
      const res = await saveContentAction({ kind, id: item?.id, version: isNew ? undefined : version, data });
      setResult(res);
      if (!res.ok) return;
      if (isNew) {
        router.push(`${editHref(kind, res.data.id)}?created=1`);
        return;
      }
      setVersion(res.data.version);
      onSaved?.(res.data);
      router.refresh();
    });
  }

  const errorEntries = Object.entries(errors);
  const wasLive = item && item.reviewStatus !== "draft";

  return (
    <ErrorsContext.Provider value={errors}>
      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={pending}>
        {wasLive && (
          <Alert tone="warning">
            This item is <strong>{item.reviewStatus}</strong>
            {item.publishStatus === "published" ? " and published" : ""}. Saving changes returns it to <strong>draft</strong>
            {item.publishStatus === "published" ? " and hides it from learners" : ""} until it is reviewed, approved and published again.
          </Alert>
        )}

        {children}

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ variant: "primary" })}
          >
            {pending ? "Saving…" : (submitLabel ?? (isNew ? "Create draft" : "Save changes"))}
          </button>
          {!isNew && <span className="text-xs tabular-nums text-ink-muted">Editing version v{version}</span>}
          {result?.ok && !isNew && (
            <span role="status" className="text-sm text-success-700">
              Saved as v{result.data.version} · {result.data.reviewStatus} · {result.data.publishStatus}
            </span>
          )}
        </div>

        {result && !result.ok && (
          <div role="alert" className="rounded-md border border-danger-700/20 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-700">
            <p className="font-medium">{result.message}</p>
            {errorEntries.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
                {errorEntries.map(([path, messages]) => (
                  <li key={path}>
                    <code className="font-mono">{path === "_form" ? "form" : path}</code>: {messages.join(" · ")}
                  </li>
                ))}
              </ul>
            )}
            {result.code === "CONFLICT" && !isNew && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={buttonClass({ variant: "danger", size: "sm", className: "mt-2" })}
              >
                Reload the latest version (discards your changes)
              </button>
            )}
          </div>
        )}
      </form>
    </ErrorsContext.Provider>
  );
}
