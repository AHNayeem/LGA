"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import * as contentService from "@/lib/services/contentService";
import { runAction, formToObject } from "@/lib/actions/result";

// Thin adapters: authenticate, pass the actor to the service (which authorises), revalidate.

export async function transitionReviewAction(_prev, formData) {
  const { kind, id, to } = formToObject(formData, ["kind", "id", "to"]);
  const result = await runAction("content.review", async () => {
    const actor = await requireUser();
    return contentService.transitionReview(actor, kind, { id, to });
  });
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}

export async function bulkModuleTransitionAction(_prev, formData) {
  const { moduleId, step } = formToObject(formData, ["moduleId", "step"]);
  const result = await runAction("content.bulk", async () => {
    const actor = await requireUser();
    return contentService.bulkModuleTransition(actor, moduleId, step);
  });
  if (result.ok) {
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
  }
  return result;
}

// Admin list selection: one step for the checked items (`ids`, repeated) of one type.
export async function bulkSelectionAction(_prev, formData) {
  const { kind, step } = formToObject(formData, ["kind", "step"]);
  const ids = formData.getAll("ids").filter((v) => typeof v === "string");
  const result = await runAction("content.bulk_selection", async () => {
    const actor = await requireUser();
    return contentService.bulkSelectionTransition(actor, kind, ids, step);
  });
  if (result.ok) {
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function setPublishStatusAction(_prev, formData) {
  const { kind, id, to } = formToObject(formData, ["kind", "id", "to"]);
  const result = await runAction("content.publish", async () => {
    const actor = await requireUser();
    return contentService.setPublishStatus(actor, kind, { id, to });
  });
  if (result.ok) {
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
  }
  return result;
}

// CMS editors send a JSON payload { kind, id?, version?, data }. The service validates it
// with the content schemas, checks relationships and applies the normal lifecycle rules;
// nothing in the payload can set a review or publish state.
export async function saveContentAction(input) {
  const result = await runAction("content.save", async () => {
    const actor = await requireUser();
    return contentService.saveContent(actor, input);
  });
  if (result.ok) {
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
  }
  return result;
}

// Read-only search for the lesson composer's pickers (drafts included, admins only).
export async function searchContentAction(kind, query) {
  return runAction("content.search", async () => {
    const actor = await requireUser();
    return contentService.searchContentOptions(actor, String(kind), query && typeof query === "object" ? query : {});
  });
}
