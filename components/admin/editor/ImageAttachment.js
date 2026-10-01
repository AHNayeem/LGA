"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { searchMediaAction } from "@/app/actions/media";
import { LocalizedInput, useFieldErrors } from "@/components/admin/editor/fields";
import { ImagePreview, mediaMeta, sourceLabel } from "@/components/admin/media/labels";

// Image attached to one place in the content (an intro block, a word, an exercise
// stimulus), picked from the media library. The editor stores the image's id with the
// alt text and caption for this place; the server checks on save that the id is an
// active curriculum image and that alt text is given. Learners see it once the content
// is approved and published; the draft preview shows it right away.

function ImagePicker({ onPick, onCancel }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    const t = setTimeout(
      () => startTransition(async () => setResult(await searchMediaAction({ q, kind: "image" }))),
      first.current ? 0 : 300,
    );
    first.current = false;
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="rounded-lg border border-line bg-surface p-3" role="group" aria-label="Image library">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-40 flex-1 flex-col gap-0.5">
          <label htmlFor={`${id}-q`} className="text-xs font-medium">
            Search images
          </label>
          <input
            id={`${id}-q`}
            type="search"
            className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Title, file name, alt text"
          />
        </div>
        <button type="button" onClick={onCancel} className="h-8 rounded-md px-2 text-xs text-ink-muted hover:underline">
          Cancel
        </button>
      </div>
      <div className="mt-2" aria-live="polite">
        {pending && !result && <p className="text-xs text-ink-muted">Searching…</p>}
        {result && !result.ok && <p className="text-xs text-danger-700">{result.message}</p>}
        {result?.ok && result.data.items.length === 0 && (
          <p className="text-xs text-ink-muted">
            No active images found.{" "}
            <a href="/admin/media/new" target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
              Upload one
            </a>{" "}
            and search again.
          </p>
        )}
        {result?.ok && result.data.items.length > 0 && (
          <ul className={`grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 ${pending ? "opacity-60" : ""}`}>
            {result.data.items.map((m) => (
              <li key={m.id} className="flex flex-col gap-1 rounded-md border border-line p-2 text-xs">
                <ImagePreview id={m.id} alt="" className="h-24 w-full" />
                <p className="truncate font-medium">{m.title}</p>
                <p className="truncate text-ink-muted">{mediaMeta(m)}</p>
                <button
                  type="button"
                  onClick={() => onPick(m)}
                  className="mt-auto h-7 rounded-md border border-line px-2 font-medium hover:bg-brand-50"
                  aria-label={`Use ${m.title}`}
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        )}
        {result?.ok && result.data.total > result.data.items.length && (
          <p className="mt-1 text-xs text-ink-muted">
            Showing {result.data.items.length} of {result.data.total}. Refine the search to see more.
          </p>
        )}
      </div>
    </div>
  );
}

// value: imageState ({ mediaId, alt, caption }) · path: field-error path ("image",
// "stimulus.image", "blocks.2.image") · media: known summaries by id, onKnown(m) adds one
export default function ImageAttachment({ value, onChange, path, media, onKnown, label = "Image (optional)", hint }) {
  const [picking, setPicking] = useState(false);
  const idErrors = useFieldErrors(`${path}.mediaId`);
  const groupErrors = useFieldErrors(path);
  const info = value.mediaId ? media[value.mediaId] : null;
  const unusable = value.mediaId && info && info.usable === false;

  function pick(m) {
    onKnown(m);
    // Prefill the alt text from the library's default, but never overwrite what's there.
    const hasAlt = Object.values(value.alt).some((v) => v.trim());
    onChange({ ...value, mediaId: m.id, alt: hasAlt || !m.alt ? value.alt : { ...value.alt, en: m.alt } });
    setPicking(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-line-strong p-3" data-testid="image-attachment">
      <p className="text-xs font-medium">{label}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}

      {value.mediaId ? (
        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <ImagePreview id={value.mediaId} alt="" className="h-28 w-40" />
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <p className="truncate font-medium">{info?.title ?? "Attached image"}</p>
              {info?.usable !== false && info?.width && <p className="text-xs text-ink-muted">{[sourceLabel(info), mediaMeta(info)].filter(Boolean).join(" · ")}</p>}
              {unusable && (
                <p className="text-xs text-danger-700">
                  The attached image is {info.status === "missing" ? "deleted" : info.status}. Learners won&apos;t see it; choose another one.
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <a href={`/admin/media/${value.mediaId}`} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
                  Details
                </a>
                <button type="button" onClick={() => setPicking(true)} className="h-7 rounded-md border border-line px-2 text-xs hover:bg-canvas">
                  Change
                </button>
                <button type="button" onClick={() => onChange({ ...value, mediaId: "" })} className="h-7 rounded-md border border-line px-2 text-xs hover:bg-canvas">
                  Remove image
                </button>
              </div>
            </div>
          </div>
          <LocalizedInput
            label="Alt text"
            hint="Required. Describe what the image shows for learners who can't see it (what matters here, not the file)."
            value={value.alt}
            onChange={(alt) => onChange({ ...value, alt })}
            path={`${path}.alt`}
          />
          <LocalizedInput label="Caption (optional)" value={value.caption} onChange={(caption) => onChange({ ...value, caption })} path={`${path}.caption`} />
        </div>
      ) : (
        !picking && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setPicking(true)} className="h-7 rounded-md border border-line px-2 text-xs font-medium hover:bg-brand-50">
              Add an image
            </button>
            <a href="/admin/media/new" target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
              Upload new image
            </a>
          </div>
        )
      )}
      {[...idErrors, ...groupErrors].length > 0 && <p className="mt-1 text-xs text-danger-700">{[...idErrors, ...groupErrors].join(" · ")}</p>}

      {picking && (
        <div className="mt-2">
          <ImagePicker onCancel={() => setPicking(false)} onPick={pick} />
        </div>
      )}
    </div>
  );
}

// Known image summaries for one editor: the server's (getContentForAdmin().images) plus
// the ones picked in this session.
export function useImageLibrary(initial) {
  const [media, setMedia] = useState(() => initial ?? {});
  return { media, onKnown: (m) => setMedia((prev) => ({ ...prev, [m.id]: m })) };
}
