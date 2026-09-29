"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import * as learningService from "@/lib/services/learningService";
import * as recordingService from "@/lib/services/recordingService";
import { runAction } from "@/lib/actions/result";

// Thin adapters for the lesson player. Inputs are plain objects; the service validates
// them, re-checks visibility and computes every result server-side.

export async function submitExerciseAction(input) {
  const result = await runAction("learning.submit", async () => {
    const actor = await requireUser();
    return learningService.submitExerciseAttempt(actor, input);
  });
  if (result.ok) refresh();
  return result;
}

export async function completeBlockAction(input) {
  const result = await runAction("learning.completeBlock", async () => {
    const actor = await requireUser();
    return learningService.completeContentBlock(actor, input);
  });
  if (result.ok) refresh();
  return result;
}

// CMS draft preview: grades and reveals like submitExerciseAction but stores nothing.
// No refresh: nothing on the page changed on the server.
export async function previewExerciseAction(input) {
  return runAction("learning.previewExercise", async () => {
    const actor = await requireUser();
    return learningService.previewExerciseAttempt(actor, input);
  });
}

// No refresh: rating a card shouldn't re-render the deck mid-session.
export async function reviewVocabularyAction(input) {
  return runAction("learning.reviewVocabulary", async () => {
    const actor = await requireUser();
    return learningService.reviewVocabulary(actor, input);
  });
}

// Deletes one of the learner's own speaking recordings (metadata and bytes). No refresh:
// progress doesn't change, and the item shows its own "deleted" state.
export async function deleteRecordingAction(input) {
  return runAction("learning.deleteRecording", async () => {
    const actor = await requireUser();
    return recordingService.deleteOwnRecording(actor, input);
  });
}
