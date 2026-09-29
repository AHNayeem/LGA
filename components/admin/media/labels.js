// Labels and badges for the admin media library, the exercise audio panels and the image
// attachments. No hooks, so server and client components can both use them.

export const MEDIA_SOURCE_LABELS = Object.freeze({
  native: "Native recording",
  licensed: "Licensed recording",
  tts: "Generated TTS",
});

const IMAGE_SOURCE_LABELS = Object.freeze({ native: "Own image", licensed: "Licensed image" });

// Source label for either kind ("native" means an own recording / own image).
export function sourceLabel(m) {
  if (!m?.source) return null;
  return (m.kind === "image" ? IMAGE_SOURCE_LABELS[m.source] : MEDIA_SOURCE_LABELS[m.source]) ?? m.source;
}

// Audio source of a listening target or exercise (audioService.exerciseAudioStatuses).
const AUDIO_SOURCE = {
  native: { label: "Native audio attached", style: "bg-success-50 text-success-700" },
  tts: { label: "TTS fallback", style: "bg-brand-50 text-brand-700" },
  mixed: { label: "Native + TTS", style: "bg-success-50 text-success-700" },
  missing: { label: "Audio missing", style: "bg-danger-50 text-danger-700" },
};

export function AudioSourceBadge({ source, missing }) {
  const s = AUDIO_SOURCE[source];
  if (!s) return <span className="text-xs text-ink-muted">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.style}`} data-testid="audio-source">
      {s.label}
      {source === "missing" && missing > 0 ? ` (${missing})` : ""}
    </span>
  );
}

export function MediaStatusBadge({ status }) {
  if (!status) return null;
  const style = status === "active" ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{status}</span>;
}

export function formatDuration(sec) {
  if (sec == null) return null;
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatSize(bytes) {
  if (bytes == null) return null;
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${Math.round((bytes / 1048576) * 10) / 10} MB`;
}

// Plays through /api/media/:id, the same authorised path learners use.
export function AudioPreview({ id, label = "Preview" }) {
  return <audio controls preload="none" src={`/api/media/${id}`} aria-label={label} className="h-9 w-full max-w-xs" />;
}

// Loads through /api/media/:id like learners do. Decorative in the admin (the title is
// next to it), so the caller usually passes alt="".
export function ImagePreview({ id, alt = "", className = "h-16 w-24" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- authorised /api/media route, not optimisable
    <img src={`/api/media/${id}`} alt={alt} loading="lazy" decoding="async" className={`rounded border border-line bg-canvas object-contain ${className}`} />
  );
}

export function mediaMeta(m) {
  const dims = m.width && m.height ? `${m.width}×${m.height}` : null;
  return [m.mime?.replace(/^(audio|image)\//, ""), formatDuration(m.durationSec), dims, formatSize(m.size)].filter(Boolean).join(" · ");
}
