// Browser-side upload of a speaking recording. Returns the opaque recording view
// { id, mime, size, durationSec } or throws an Error with a learner-friendly message.
//
// This is the only place that knows *how* bytes reach storage. A future direct-to-storage
// upload (presigned URL + completion call) replaces this function; the lesson UI and the
// submission contract (answers carry only `recordingId`) stay the same.

export async function uploadRecording({ blob, lessonId, exerciseId, itemId, durationSec }) {
  const qs = new URLSearchParams({ lessonId, exerciseId, itemId });
  if (Number.isFinite(durationSec)) qs.set("duration", String(Math.round(durationSec * 10) / 10));
  let res;
  try {
    res = await fetch(`/api/recordings?${qs}`, {
      method: "POST",
      // No type from the recorder: send none (the server checks the bytes' signature).
      headers: blob.type ? { "Content-Type": blob.type } : {},
      body: blob,
      credentials: "same-origin",
    });
  } catch {
    throw new Error("The recording could not be uploaded. Check your connection and try again.");
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON (e.g. a proxy error page)
  }
  if (!res.ok || !body?.ok) {
    if (res.status === 401) throw new Error("Your session has ended. Please sign in again.");
    throw new Error(body?.message ?? "The recording could not be uploaded. Please try again.");
  }
  return body.recording;
}
