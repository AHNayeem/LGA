"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGuestState } from "@/lib/learning/guestStore";
import { lessonViewWithState } from "@/lib/learning/journey";
import LessonView from "@/components/learn/LessonView";

// A guest's lesson: the published lesson view from the server (no learner state) with the
// guest's own progress from this browser applied by the same functions the server uses.
// Until the browser state is read (server render, hydration) a neutral placeholder shows.
// Without a step in the URL the guest goes to their first open step, as a signed-in
// learner does via the server.
export default function GuestLesson({ data, locale, base, levelHref, moduleHref, blockParam = null, showResult = false, unavailableMessage, returnLink = null }) {
  const router = useRouter();
  const state = useGuestState();
  const view = state ? lessonViewWithState(data, state.lessons[data.lesson.id] ?? null) : null;
  const target = view?.available && !showResult && !view.blocks.some((b) => b.key === blockParam) ? (view.blocks.find((b) => !b.done) ?? view.blocks[0]).key : null;

  useEffect(() => {
    if (target) router.replace(`${base}?block=${target}`);
  }, [target, base, router]);

  if (!data.available) {
    return <LessonView data={data} locale={locale} hrefFor={() => base} levelHref={levelHref} moduleHref={moduleHref} exitHref={moduleHref} unavailableMessage={unavailableMessage} />;
  }
  if (!view || target) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <p className="text-sm text-ink-muted">Loading your lesson…</p>
      </div>
    );
  }
  return (
    <LessonView
      data={view}
      locale={locale}
      currentKey={blockParam}
      hrefFor={(key) => `${base}?block=${key}`}
      levelHref={levelHref}
      moduleHref={moduleHref}
      exitHref={moduleHref}
      exitLabel="Back to module"
      unavailableMessage={unavailableMessage}
      mode="guest"
      resultHref={`${base}?view=result`}
      showResult={showResult}
      returnLink={returnLink}
    />
  );
}
