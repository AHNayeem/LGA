"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAction, exerciseAudioTargetsAction, setExerciseAudioMediaAction, setMediaStatusAction, updateMediaAction } from "@/app/actions/media";
import ContentPicker from "@/components/admin/editor/ContentPicker";
import StatusBadge from "@/components/ui/StatusBadge";
import { AudioSourceBadge } from "@/components/admin/media/labels";
import { editHref } from "@/lib/content/adminSections";

// Client controls of the media detail page. Every action goes through a Server Action
// whose service re-checks permissions, references and versions; the UI only offers the
// likely next step and shows the server's answer.

function Feedback({ result, success }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p role="status" className="text-sm text-success-700">
        {success}
      </p>
    );
  }
  return (
    <p role="alert" className="text-sm text-danger-700">
      {result.message}
    </p>
  );
}

const input = "w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm";
const button = "inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-canvas disabled:opacity-50";

export function MediaMetadataForm({ media }) {
  const id = useId();
  const router = useRouter();
  const [meta, setMeta] = useState({
    title: media.title ?? "",
    source: media.source,
    voice: media.voice ?? "",
    license: media.license ?? "",
    language: media.language ?? "de-DE",
    transcript: media.transcript ?? "",
    alt: media.alt ?? "",
  });
  const isImage = media.kind === "image";
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const set = (patch) => setMeta((m) => ({ ...m, ...patch }));
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const err = (k) => errors[k] && <p className="text-xs text-danger-700">{errors[k].join(" · ")}</p>;

  function onSubmit(e) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateMediaAction(media.id, meta);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor={`${id}-title`} className="text-xs font-medium">
            Title
          </label>
          <input id={`${id}-title`} className={input} value={meta.title} onChange={(e) => set({ title: e.target.value })} />
          {err("title")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-source`} className="text-xs font-medium">
            Source
          </label>
          <select id={`${id}-source`} className={input} value={meta.source} onChange={(e) => set({ source: e.target.value })}>
            <option value="native">{isImage ? "Own image" : "Native recording"}</option>
            <option value="licensed">{isImage ? "Licensed image" : "Licensed recording"}</option>
          </select>
        </div>
        {!isImage && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-lang`} className="text-xs font-medium">
                Language
              </label>
              <input id={`${id}-lang`} className={`${input} font-mono`} value={meta.language} onChange={(e) => set({ language: e.target.value })} />
              {err("language")}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-voice`} className="text-xs font-medium">
                Speaker
              </label>
              <input id={`${id}-voice`} className={input} value={meta.voice} onChange={(e) => set({ voice: e.target.value })} />
            </div>
          </>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-license`} className="text-xs font-medium">
            License / source{meta.source === "licensed" ? "" : " (optional)"}
          </label>
          <input id={`${id}-license`} className={input} value={meta.license} onChange={(e) => set({ license: e.target.value })} />
          {err("license")}
        </div>
        {isImage ? (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={`${id}-alt`} className="text-xs font-medium">
              Default alt text, English
            </label>
            <input id={`${id}-alt`} className={input} value={meta.alt} onChange={(e) => set({ alt: e.target.value })} />
            <p className="text-xs text-ink-muted">Prefilled when the image is attached. Learners get the alt text set on each attachment, not this one.</p>
            {err("alt")}
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={`${id}-transcript`} className="text-xs font-medium">
              Transcript (internal reference)
            </label>
            <textarea id={`${id}-transcript`} rows={4} lang="de" className={input} value={meta.transcript} onChange={(e) => set({ transcript: e.target.value })} />
            <p className="text-xs text-ink-muted">Learners see the exercise&apos;s listening lines as the transcript, not this text.</p>
            {err("transcript")}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Saving…" : "Save details"}
        </button>
        <Feedback result={result} success="Details saved." />
      </div>
    </form>
  );
}

export function MediaStatusControls({ media, usedBy }) {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const run = (fn, after) =>
    startTransition(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) after();
    });
  const archived = media.status === "archived";
  const noun = media.kind === "image" ? "image" : "audio";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!archived && (
          <button
            type="button"
            className={button}
            disabled={pending || usedBy > 0}
            title={usedBy > 0 ? "Remove it from everything that uses it first" : undefined}
            onClick={() => window.confirm(`Archive this ${noun}? It can't be attached while archived.`) && run(() => setMediaStatusAction(media.id, "archived"), () => router.refresh())}
          >
            Archive
          </button>
        )}
        {archived && (
          <>
            <button type="button" className={button} disabled={pending} onClick={() => run(() => setMediaStatusAction(media.id, "active"), () => router.refresh())}>
              Restore
            </button>
            <button
              type="button"
              className={`${button} text-danger-700`}
              disabled={pending || usedBy > 0}
              onClick={() =>
                window.confirm(`Delete this ${noun} permanently? The file is removed and can't be restored.`) &&
                run(() => deleteMediaAction(media.id), () => router.push("/admin/media?deleted=1"))
              }
            >
              Delete permanently
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-ink-muted">
        {usedBy > 0
          ? `Used by ${usedBy} item(s): it can't be archived or deleted until it is removed from them.`
          : archived
            ? `Archived: hidden from pickers and never ${noun === "image" ? "shown" : "played"}. Delete removes the file for good.`
            : `Not used anywhere. Archive it to hide it; an archived ${noun} can then be deleted.`}
      </p>
      <Feedback result={result} success="Done." />
    </div>
  );
}

// Content using this upload. Exercises using a recording get a "Remove" per listening
// target (an exercise edit, back to draft; the recording is kept). Images are changed in
// the item's editor, so their places are listed next to the link.
const USAGE_KIND = { exercises: "Exercise", vocabulary: "Word", lessons: "Lesson" };

export function MediaUsageList({ usedBy }) {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  if (usedBy.length === 0) return <p className="text-sm text-ink-muted">Not attached to anything yet.</p>;

  function remove(ex, target) {
    const warn = ex.reviewStatus !== "draft" ? " The exercise goes back to draft and must be reviewed and published again." : "";
    if (!window.confirm(`Remove this audio from “${ex.label}”? It falls back to TTS where available.${warn}`)) return;
    startTransition(async () => {
      const res = await setExerciseAudioMediaAction({ exerciseId: ex.id, version: ex.version, target, mediaId: null });
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-line rounded-lg border border-line" data-testid="media-usage">
        {usedBy.map((ex) => (
          <li key={`${ex.kind}-${ex.id}`} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
            <Link href={editHref(ex.kind, ex.id)} className="mr-auto text-brand-700 hover:underline" lang="de">
              {ex.label}
            </Link>
            <span className="text-xs text-ink-muted">
              {[USAGE_KIND[ex.kind] ?? ex.kind, ...ex.images].join(" · ")}
            </span>
            <StatusBadge status={ex.reviewStatus} />
            <StatusBadge status={ex.publishStatus} />
            {ex.targets.map((t) => (
              <button key={t} type="button" disabled={pending} onClick={() => remove(ex, t)} className="h-7 rounded-md border border-line px-2 text-xs hover:bg-canvas disabled:opacity-50">
                Remove from {t === "stimulus" ? "passage" : `question ${t}`}
              </button>
            ))}
          </li>
        ))}
      </ul>
      <Feedback result={result} success="Removed." />
    </div>
  );
}

// Pick a listening exercise, then the passage or question to attach this recording to.
export function AttachToExercise({ media }) {
  const router = useRouter();
  const [targets, setTargets] = useState(null);
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  if (media.status === "archived") return <p className="text-sm text-ink-muted">Restore this audio to attach it.</p>;

  function pick(exercise) {
    setResult(null);
    startTransition(async () => setTargets(await exerciseAudioTargetsAction(exercise.id)));
  }

  function attach(target) {
    const data = targets.data;
    const warn = data.exercise.reviewStatus !== "draft" ? "\n\nThe exercise goes back to draft and must be reviewed and published again." : "";
    if (!window.confirm(`Attach “${media.title}” to ${target.label}?${warn}`)) return;
    startTransition(async () => {
      const res = await setExerciseAudioMediaAction({ exerciseId: data.exercise.id, version: data.version, target: target.target, mediaId: media.id });
      setResult(res);
      if (res.ok) {
        setTargets(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <ContentPicker kind="exercises" label="Find an exercise" defaultSkill="listening" onPick={pick} actionLabel="Choose" />
      {targets && !targets.ok && <p role="alert" className="text-sm text-danger-700">{targets.message}</p>}
      {targets?.ok && (
        <div className="rounded-lg border border-line p-3">
          <p className="text-sm font-medium" lang="de">
            {targets.data.exercise.label}
          </p>
          {targets.data.targets.length === 0 ? (
            <p className="mt-1 text-sm text-ink-muted">This exercise has no listening audio. Add listening lines or item audio in the exercise editor first.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {targets.data.targets.map((t) => (
                <li key={t.target} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="mr-auto" lang="de">
                    {t.label}
                  </span>
                  <AudioSourceBadge source={t.source} />
                  <button
                    type="button"
                    disabled={pending || t.mediaId === media.id}
                    onClick={() => attach(t)}
                    className="h-7 rounded-md border border-line px-2 text-xs font-medium hover:bg-brand-50 disabled:opacity-40"
                  >
                    {t.mediaId === media.id ? "Attached" : t.mediaId ? "Replace" : "Attach"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Feedback result={result} success="Attached. The exercise was saved as a new version." />
    </div>
  );
}
