"use client";

import { useActionState } from "react";
import { transitionReviewAction, setPublishStatusAction } from "@/app/actions/content";
import SubmitButton from "@/components/ui/SubmitButton";

const NEXT_REVIEW = { draft: "reviewed", reviewed: "approved" };
const REVIEW_LABEL = { reviewed: "Mark reviewed", approved: "Approve" };

function ActionForm({ action, kind, id, to, label }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="inline-flex flex-col">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <SubmitButton variant="secondary" pendingLabel="…" className="h-8 px-3 text-xs">
        {label}
      </SubmitButton>
      {state && !state.ok && (
        <span role="alert" className="mt-1 max-w-48 text-xs text-danger-700">
          {state.message}
        </span>
      )}
    </form>
  );
}

// The server decides what is allowed; these buttons only offer the likely next step.
export default function LifecycleControls({ kind, item }) {
  const nextReview = NEXT_REVIEW[item.reviewStatus];
  return (
    <div className="flex flex-wrap gap-2">
      {nextReview && (
        <ActionForm action={transitionReviewAction} kind={kind} id={item.id} to={nextReview} label={REVIEW_LABEL[nextReview]} />
      )}
      {item.reviewStatus !== "draft" && (
        <ActionForm action={transitionReviewAction} kind={kind} id={item.id} to="draft" label="Back to draft" />
      )}
      {item.reviewStatus === "approved" && item.publishStatus !== "published" && (
        <ActionForm action={setPublishStatusAction} kind={kind} id={item.id} to="published" label="Publish" />
      )}
      {item.publishStatus === "published" && (
        <ActionForm action={setPublishStatusAction} kind={kind} id={item.id} to="unpublished" label="Unpublish" />
      )}
    </div>
  );
}
