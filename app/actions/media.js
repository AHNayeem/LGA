"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import * as mediaService from "@/lib/services/mediaService";
import * as contentService from "@/lib/services/contentService";
import { runAction } from "@/lib/actions/result";

// Thin adapters for the admin media library: authenticate, pass the actor to the service
// (which authorises: media:manage, plus content:write for attachments), revalidate.
// File uploads don't go through Server Actions; they use the byte-limited route handlers
// under /api/admin/media.

const plain = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

export async function updateMediaAction(id, data) {
  const result = await runAction("media.update", async () => {
    const actor = await requireUser();
    return mediaService.updateCurriculumMedia(actor, String(id), plain(data));
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function setMediaStatusAction(id, status) {
  const result = await runAction("media.status", async () => {
    const actor = await requireUser();
    return mediaService.setCurriculumMediaStatus(actor, String(id), String(status));
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function deleteMediaAction(id) {
  const result = await runAction("media.delete", async () => {
    const actor = await requireUser();
    return mediaService.deleteCurriculumMedia(actor, String(id));
  });
  if (result.ok) revalidateAdmin();
  return result;
}

// Read-only picker search (active uploads only).
export async function searchMediaAction(query) {
  return runAction("media.search", async () => {
    const actor = await requireUser();
    return mediaService.searchCurriculumMedia(actor, plain(query));
  });
}

// Listening targets of one exercise (stimulus / items with audio) and their audio source.
export async function exerciseAudioTargetsAction(exerciseId) {
  return runAction("media.targets", async () => {
    const actor = await requireUser();
    return contentService.listExerciseAudioTargets(actor, String(exerciseId));
  });
}

// { exerciseId, version, target, mediaId | null }: attach, replace or remove a recording.
export async function setExerciseAudioMediaAction(input) {
  const result = await runAction("media.attach", async () => {
    const actor = await requireUser();
    return contentService.setExerciseAudioMedia(actor, plain(input));
  });
  if (result.ok) {
    revalidateAdmin();
    revalidatePath("/dashboard");
  }
  return result;
}
