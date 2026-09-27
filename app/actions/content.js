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
