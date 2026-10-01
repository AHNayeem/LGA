"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MEDIA_SOURCE_LABELS } from "@/components/admin/media/labels";
import { buttonClass } from "@/components/ui/button";

// Uploads one audio or image file to the admin media route (raw body, so the byte limit
// and the signature check run on the server before anything is stored). XMLHttpRequest is
// used only for its upload progress events. The browser's type check (`accept`) and the
// kind guessed from the chosen file only pick the form fields; the server decides the
// kind from the bytes and validates them, the declared type and the extension.
//
//   replaceId    set: replaces the file of that asset (PUT), metadata stays unchanged
//   replaceKind  "audio" | "image": the kind the replacement must have
//   limits       { audio, image } upload limits in bytes

const AUDIO_ACCEPT = ".mp3,.m4a,.mp4,.ogg,.oga,.opus,.wav,.webm,.weba,audio/*";
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif";
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

const guessKind = (file) => (file && (file.type.startsWith("image/") || IMAGE_EXT.test(file.name)) ? "image" : "audio");
const mb = (bytes) => Math.round((bytes / 1048576) * 10) / 10;

function measureDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    const done = (v) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : null);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(null);
    a.src = url;
  });
}

function send({ method, url, file, onProgress }) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON error page
      }
      resolve(body ?? { ok: false, message: `Upload failed (${xhr.status}).`, fieldErrors: {} });
    };
    xhr.onerror = () => resolve({ ok: false, message: "Network error. Check the connection and try again.", fieldErrors: {} });
    xhr.send(file);
  });
}

export default function MediaUploadForm({ replaceId = null, replaceKind = null, limits = {} }) {
  const id = useId();
  const router = useRouter();
  const fileRef = useRef(null);
  const [kind, setKind] = useState(replaceKind ?? "audio");
  const [meta, setMeta] = useState({ title: "", source: "native", license: "", voice: "", language: "de-DE", alt: "" });
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const set = (patch) => setMeta((m) => ({ ...m, ...patch }));
  const busy = progress != null;
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  async function onSubmit(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setResult({ ok: false, message: "Choose a file.", fieldErrors: {} });
    const fileKind = guessKind(file);
    const maxBytes = limits[fileKind];
    if (maxBytes && file.size > maxBytes) {
      return setResult({ ok: false, message: `The file is too large (max ${mb(maxBytes)} MB).`, fieldErrors: {} });
    }
    setResult(null);
    setProgress(0);
    const duration = fileKind === "audio" ? await measureDuration(file) : null;
    const qs = new URLSearchParams({ filename: file.name, ...(duration ? { duration: String(duration) } : {}) });
    const fields = fileKind === "image" ? ["title", "source", "license", "alt"] : ["title", "source", "license", "voice", "language"];
    if (!replaceId) for (const k of fields) if (meta[k]) qs.set(k, meta[k]);
    const res = await send({
      method: replaceId ? "PUT" : "POST",
      url: `/api/admin/media${replaceId ? `/${replaceId}` : ""}?${qs}`,
      file,
      onProgress: setProgress,
    });
    setProgress(null);
    setResult(res);
    if (!res.ok) return;
    if (replaceId) {
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } else {
      router.push(`/admin/media/${res.media.id}?uploaded=1`);
    }
  }

  const input = "w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm";
  const fieldError = (k) => errors[k] && <p className="text-xs text-danger-700">{errors[k].join(" · ")}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-busy={busy} noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-file`} className="text-xs font-medium">
          {replaceId ? "New file" : "Audio or image file"}
        </label>
        <input
          id={`${id}-file`}
          ref={fileRef}
          type="file"
          accept={replaceKind === "image" ? IMAGE_ACCEPT : replaceKind === "audio" ? AUDIO_ACCEPT : `${AUDIO_ACCEPT},${IMAGE_ACCEPT}`}
          disabled={busy}
          className="text-sm"
          data-testid="media-file"
          onChange={(e) => !replaceKind && setKind(guessKind(e.target.files?.[0]))}
        />
        <p className="text-xs text-ink-muted">
          {replaceKind !== "image" && <>Audio: MP3, M4A, Ogg, WAV or WebM{limits.audio ? `, up to ${mb(limits.audio)} MB` : ""}. </>}
          {replaceKind !== "audio" && (
            <>
              Images: PNG, JPEG, WebP or GIF{limits.image ? `, up to ${mb(limits.image)} MB` : ""} and 8000 px per side (no SVG).{" "}
            </>
          )}
          The file is checked on the server.
        </p>
      </div>
      {!replaceId && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={`${id}-title`} className="text-xs font-medium">
              Title
            </label>
            <input id={`${id}-title`} className={input} value={meta.title} onChange={(e) => set({ title: e.target.value })} placeholder={kind === "image" ? "e.g. Schild: Bahnhof, Gleis 3" : "e.g. Dialog: Am Bahnhof (Sprecherin A)"} />
            {fieldError("title")}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-source`} className="text-xs font-medium">
              Source
            </label>
            <select id={`${id}-source`} className={input} value={meta.source} onChange={(e) => set({ source: e.target.value })}>
              <option value="native">{kind === "image" ? "Own image (made or photographed by us)" : `${MEDIA_SOURCE_LABELS.native} (own speaker)`}</option>
              <option value="licensed">{kind === "image" ? "Licensed image (third party)" : `${MEDIA_SOURCE_LABELS.licensed} (third party)`}</option>
            </select>
          </div>
          {kind === "audio" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-voice`} className="text-xs font-medium">
                Speaker (optional)
              </label>
              <input id={`${id}-voice`} className={input} value={meta.voice} onChange={(e) => set({ voice: e.target.value })} />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-alt`} className="text-xs font-medium">
                Default alt text, English (optional)
              </label>
              <input id={`${id}-alt`} className={input} value={meta.alt} onChange={(e) => set({ alt: e.target.value })} placeholder="What the image shows" />
              {fieldError("alt")}
            </div>
          )}
          {meta.source === "licensed" && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor={`${id}-license`} className="text-xs font-medium">
                License / source
              </label>
              <input id={`${id}-license`} className={input} value={meta.license} onChange={(e) => set({ license: e.target.value })} />
              {fieldError("license")}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={buttonClass({ variant: "primary" })}>
          {busy ? "Uploading…" : replaceId ? "Replace file" : "Upload"}
        </button>
        {busy && (
          <span className="flex items-center gap-2 text-xs text-ink-muted" role="status">
            <progress max={100} value={progress} className="h-2 w-32" /> {progress}%
          </span>
        )}
        {result?.ok && replaceId && (
          <span role="status" className="text-sm text-success-700">
            File replaced.
          </span>
        )}
      </div>
      {result && !result.ok && (
        <p role="alert" className="rounded-lg border border-danger-700/20 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {result.message}
        </p>
      )}
    </form>
  );
}
