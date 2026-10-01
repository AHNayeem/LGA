"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { searchMediaAction } from "@/app/actions/media";
import { useFieldErrors } from "@/components/admin/editor/fields";
import { AudioPreview, AudioSourceBadge, MEDIA_SOURCE_LABELS, mediaMeta } from "@/components/admin/media/labels";

// Audio source of one listening target (the stimulus passage or one item's audio):
// an attached recording from the media library, or generated TTS for the cue text.
// The editor only stores the recording's id; the server checks it on save (active
// curriculum upload) and decides what learners hear:
//   attached active recording → generated TTS → "audio missing" (publishing blocked)
// TTS status comes from the saved version: generation runs offline (audio:generate).

function MediaPicker({ onPick, onCancel }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    const t = setTimeout(
      () => startTransition(async () => setResult(await searchMediaAction({ q, source }))),
      first.current ? 0 : 300,
    );
    first.current = false;
    return () => clearTimeout(t);
  }, [q, source]);

  const input = "rounded-md border border-line bg-surface px-2 py-1 text-sm";
  return (
    <div className="rounded-lg border border-line bg-surface p-3" role="group" aria-label="Media library">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-40 flex-1 flex-col gap-0.5">
          <label htmlFor={`${id}-q`} className="text-xs font-medium">
            Search recordings
          </label>
          <input
            id={`${id}-q`}
            type="search"
            className={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Title, file name, transcript"
          />
        </div>
        <select aria-label="Source" className={input} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Native + licensed</option>
          <option value="native">Native</option>
          <option value="licensed">Licensed</option>
        </select>
        <button type="button" onClick={onCancel} className="h-8 rounded-md px-2 text-xs text-ink-muted hover:underline">
          Cancel
        </button>
      </div>
      <div className="mt-2" aria-live="polite">
        {pending && !result && <p className="text-xs text-ink-muted">Searching…</p>}
        {result && !result.ok && <p className="text-xs text-danger-700">{result.message}</p>}
        {result?.ok && result.data.items.length === 0 && (
          <p className="text-xs text-ink-muted">
            No active recordings found.{" "}
            <a href="/admin/media/new" target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
              Upload one
            </a>{" "}
            and search again.
          </p>
        )}
        {result?.ok && result.data.items.length > 0 && (
          <ul className={`max-h-72 divide-y divide-line overflow-y-auto rounded-md border border-line ${pending ? "opacity-60" : ""}`}>
            {result.data.items.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate" lang="de">
                    {m.title}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {MEDIA_SOURCE_LABELS[m.source]} · {mediaMeta(m)}
                    {m.originalName ? ` · ${m.originalName}` : ""}
                  </p>
                </div>
                <AudioPreview id={m.id} label={`Preview ${m.title}`} />
                <button
                  type="button"
                  onClick={() => onPick(m)}
                  className="h-7 rounded-md border border-line px-2 text-xs font-medium hover:bg-brand-50"
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

function ttsText(status) {
  if (!status) return "Generated TTS: not checked yet (save the exercise first).";
  const { total, available } = status.tts;
  if (total === 0) return "Generated TTS: no cue text.";
  if (available === total) return `Generated TTS: available (${total} clip${total === 1 ? "" : "s"}, as saved).`;
  return `Generated TTS: ${available} of ${total} clip(s) generated (as saved). Run \`bun run audio:generate\` for the rest.`;
}

// mediaId: "" or the attached id · status: saved status of this target (or null)
// media: known summaries by id (from the server, plus picks in this session)
export default function AudioAttachment({ mediaId, onChange, status, media, onKnown, path, label = "Recorded audio" }) {
  const [picking, setPicking] = useState(false);
  const errors = useFieldErrors(path);
  const info = mediaId ? media[mediaId] : null;
  const ttsReady = status && status.tts.total > 0 && status.tts.available === status.tts.total;
  const source = mediaId && info?.usable !== false ? "native" : ttsReady ? "tts" : "missing";

  return (
    <div className="rounded-lg border border-dashed border-line-strong p-3" data-testid="audio-attachment">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium">{label}</span>
        <AudioSourceBadge source={source} />
        {mediaId && info?.usable === false && (
          <span className="text-xs text-danger-700">The attached recording is {info.status === "missing" ? "deleted" : info.status}; learners get TTS instead.</span>
        )}
      </div>

      {mediaId ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate" lang="de">
            {info?.title ?? "Attached recording"}
            {info?.source && <span className="text-xs text-ink-muted"> · {MEDIA_SOURCE_LABELS[info.source]}</span>}
          </span>
          <AudioPreview id={mediaId} label="Preview attached recording" />
          <a href={`/admin/media/${mediaId}`} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
            Details
          </a>
          <button type="button" onClick={() => setPicking(true)} className="h-7 rounded-md border border-line px-2 text-xs hover:bg-canvas">
            Change
          </button>
          <button type="button" onClick={() => onChange("")} className="h-7 rounded-md border border-line px-2 text-xs hover:bg-canvas">
            Remove (use TTS)
          </button>
        </div>
      ) : (
        !picking && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setPicking(true)} className="h-7 rounded-md border border-line px-2 text-xs font-medium hover:bg-brand-50">
              Attach a recording
            </button>
            <a href="/admin/media/new" target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
              Upload new audio
            </a>
          </div>
        )
      )}

      <p className="mt-2 text-xs text-ink-muted">
        {ttsText(status)} {mediaId ? "Used only if the recording becomes unavailable." : "Plays when no recording is attached."}
      </p>
      {errors.length > 0 && <p className="mt-1 text-xs text-danger-700">{errors.join(" · ")}</p>}

      {picking && (
        <div className="mt-2">
          <MediaPicker
            onCancel={() => setPicking(false)}
            onPick={(m) => {
              onKnown(m);
              onChange(m.id);
              setPicking(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
