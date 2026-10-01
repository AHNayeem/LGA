"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeBlockAction } from "@/app/actions/learning";
import { updateGuestState } from "@/lib/learning/guestStore";
import { applyBlockDone } from "@/lib/learning/state";
import Alert from "@/components/ui/Alert";
import ActionError from "@/components/learn/ActionError";

// Marks a reading block (intro, grammar) as done, then moves on: on the server for a
// signed-in learner, in this browser for a guest. In the CMS draft preview nothing is
// recorded: it only moves on.
export default function ContinueButton({ lessonId, blockKey, nextHref, label = "Continue", mode = "user", lessonBlocks = null }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    if (mode === "preview") return router.push(nextHref);
    if (mode === "guest") {
      updateGuestState((s) => applyBlockDone(s, { lessonId, blockKey, blocks: lessonBlocks }));
      return router.push(nextHref);
    }
    startTransition(async () => {
      const res = await completeBlockAction({ lessonId, blockKey });
      if (!res.ok) return setError(res);
      router.push(nextHref);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : label}
      </button>
      <ActionError error={error} />
    </div>
  );
}
