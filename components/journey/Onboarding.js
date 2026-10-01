"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLearningProfileAction } from "@/app/actions/learning";
import { updateGuestState } from "@/lib/learning/guestStore";
import { applyProfile } from "@/lib/learning/state";
import { GOAL_OPTIONS } from "@/lib/learning/profile";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ActionError from "@/components/learn/ActionError";

// Two questions, then straight into learning: why the learner is learning German, and
// where to start. There is no placement test (the curriculum has no reliable diagnostic):
// a learner who knows some German picks the module to start from. Guests keep the answers
// in this browser, signed-in learners on their account.
export default function Onboarding({ levelCode, levelTitle, modules, signedIn, initial = null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(initial?.goal ?? null);
  const [start, setStart] = useState(initial?.startModule ?? "");
  const [knowsSome, setKnowsSome] = useState(Boolean(initial?.startModule));
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function finish() {
    const profile = { goal, levelCode, startModule: knowsSome && start ? start : null };
    setError(null);
    startTransition(async () => {
      if (signedIn) {
        const res = await saveLearningProfileAction(profile);
        if (!res.ok) return setError(res);
      } else {
        updateGuestState((s) => applyProfile(s, { ...profile, updatedAt: new Date().toISOString() }));
      }
      router.push(goal === "goethe" || goal === "skills" ? `/goethe/${levelCode.toLowerCase()}` : "/dashboard");
    });
  }

  const option = (checked) =>
    `flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-4 ${checked ? "border-brand-600 bg-brand-50" : "border-line bg-surface hover:bg-canvas"}`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted" aria-live="polite">
        Step {step} of 2
      </p>
      {step === 1 ? (
        <fieldset>
          <legend className="text-xl font-semibold">Why are you learning German?</legend>
          <div className="mt-4 grid gap-3">
            {GOAL_OPTIONS.map((g) => (
              <label key={g.value} className={option(goal === g.value)}>
                <input type="radio" name="goal" value={g.value} checked={goal === g.value} onChange={() => setGoal(g.value)} className="mt-1 size-4 accent-brand-600" />
                <span>
                  <span className="block font-medium">{g.label}</span>
                  <span className="block text-sm text-ink-muted">{g.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!goal}
            onClick={() => {
              if (goal === "from_zero") setKnowsSome(false);
              setStep(2);
            }}
            className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Next
          </button>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="text-xl font-semibold">Where do you want to start?</legend>
          <p className="mt-1 text-sm text-ink-muted">
            You are learning <LocalizedText text={levelTitle} prefer="de" />. You can change this later, and you can open any module at any time.
          </p>
          <div className="mt-4 grid gap-3">
            <label className={option(!knowsSome)}>
              <input type="radio" name="start" checked={!knowsSome} onChange={() => setKnowsSome(false)} className="mt-1 size-4 accent-brand-600" />
              <span>
                <span className="block font-medium">I&apos;m new to German</span>
                <span className="block text-sm text-ink-muted">Start with the first lesson: greetings and introducing yourself.</span>
              </span>
            </label>
            <label className={option(knowsSome)}>
              <input type="radio" name="start" checked={knowsSome} onChange={() => setKnowsSome(true)} className="mt-1 size-4 accent-brand-600" />
              <span>
                <span className="block font-medium">I know some German already</span>
                <span className="block text-sm text-ink-muted">Choose the module you want to start with.</span>
              </span>
            </label>
          </div>
          {knowsSome && (
            <div className="mt-4">
              <label htmlFor="start-module" className="text-sm font-medium">
                Start with
              </label>
              <select
                id="start-module"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 block h-11 w-full rounded-lg border border-line bg-surface px-3"
              >
                <option value="">Choose a module…</option>
                {modules.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    Modul {m.order}: {m.title.de ?? m.title.en}
                    {m.description?.en ? ` – ${m.description.en}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && (
            <div className="mt-4">
              <ActionError error={error} />
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => setStep(1)} className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
              Back
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={pending || (knowsSome && !start)}
              className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Start learning"}
            </button>
          </div>
          {!signedIn && <p className="mt-3 text-xs text-ink-muted">No account needed. Your choices are kept in this browser.</p>}
        </fieldset>
      )}
    </div>
  );
}
