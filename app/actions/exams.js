"use server";

import { requireUser } from "@/lib/auth/dal";
import * as examService from "@/lib/services/examService";
import * as contentService from "@/lib/services/contentService";
import { revalidatePath } from "next/cache";
import { runAction, formToObject } from "@/lib/actions/result";

// Thin adapters for exams. The client sends ids and raw answers only; the service checks
// ownership, state and time, and computes every score.

export async function startExamAction(input) {
  return runAction("exam.start", async () => {
    const actor = await requireUser();
    return examService.startExamAttempt(actor, input);
  });
}

export async function submitExamAction(input) {
  return runAction("exam.submit", async () => {
    const actor = await requireUser();
    return examService.submitExamAttempt(actor, input);
  });
}

// CMS preview: grades like submitExamAction but stores nothing.
export async function previewExamAction(input) {
  return runAction("exam.preview", async () => {
    const actor = await requireUser();
    return examService.previewExamSubmission(actor, input);
  });
}

// Admin: one review/publish step for an exam and the exercises it uses.
export async function bulkExamTransitionAction(_prev, formData) {
  const { examId, step } = formToObject(formData, ["examId", "step"]);
  const result = await runAction("exam.bulk", async () => {
    const actor = await requireUser();
    return contentService.bulkExamTransition(actor, examId, step);
  });
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}
