"use server";

import { getRequestContext } from "@/lib/security/request";
import * as learningService from "@/lib/services/learningService";
import * as examService from "@/lib/services/examService";
import { runAction } from "@/lib/actions/result";

// Guest learning (no account). The server grades on published content exactly as for a
// signed-in learner and returns the result; it stores nothing (only the per-IP rate
// limit). The browser keeps the result in the guest's own state (lib/learning/state.js),
// which is never sent back here. No refresh: nothing on the server changed.

export async function gradeGuestExerciseAction(input) {
  return runAction("guest.gradeExercise", async () => learningService.gradeExerciseAsGuest(await getRequestContext(), input));
}

export async function guestVocabularyCardsAction(input) {
  return runAction("guest.vocabularyCards", async () => learningService.getVocabularyCardsAsGuest(await getRequestContext(), input));
}

export async function gradeGuestExamAction(input) {
  return runAction("guest.gradeExam", async () => examService.gradeExamAsGuest(await getRequestContext(), input));
}
