"use client";

import { useActionState } from "react";
import { transitionReviewAction, setPublishStatusAction } from "@/app/actions/content";
import SubmitButton from "@/components/ui/SubmitButton";

const NEXT_REVIEW = { draft: "reviewed", reviewed: "approved" };
const REVIEW_LABEL = { reviewed: "Mark reviewed", approved: "Approve" };

function ActionForm({ action, kind, id, to, label, confirmMessage, danger = false }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className="inline-flex flex-col"
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <SubmitButton variant={danger ? "danger" : "secondary"} size="sm" pendingLabel="…">
        {label}
      </SubmitButton>
      {state && !state.ok && (
        <span role="alert" className="mt-1 max-w-48 text-[11px] leading-snug text-danger-700">
          {state.message}
        </span>
      )}
    </form>
  );
}

// The server decides what is allowed; these buttons only offer the likely next step.
// Archiving is the soft delete: archived content is hidden from learners and from the
// default admin lists, and "Restore" returns it to unpublished.
export default function LifecycleControls({ kind, item, archive = true }) {
  const nextReview = NEXT_REVIEW[item.reviewStatus];
  return (
    <div className="flex flex-nowrap items-start gap-1">
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
      {archive && item.publishStatus !== "archived" && (
        <ActionForm
          action={setPublishStatusAction}
          kind={kind}
          id={item.id}
          to="archived"
          label="Archive"
          danger
          confirmMessage="Archive this item? It is hidden from learners and from the default lists. Lessons that use it become unavailable until it is restored and published."
        />
      )}
      {item.publishStatus === "archived" && (
        <ActionForm action={setPublishStatusAction} kind={kind} id={item.id} to="unpublished" label="Restore" />
      )}
    </div>
  );
}
