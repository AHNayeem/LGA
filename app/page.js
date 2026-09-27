import Link from "next/link";
import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">A1 · Goethe-aligned preparation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          <span lang="de">Deutsch lernen</span> – step by step.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          A structured path from your first <span lang="de">„Hallo!“</span> to exam-style practice. Learn, practise,
          produce and review across all six skills.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
            Start A1
          </Link>
          <Link href="/login" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 font-medium hover:bg-canvas">
            Sign in
          </Link>
        </div>
      </section>

      <section aria-labelledby="skills-heading" className="mt-16">
        <h2 id="skills-heading" className="text-lg font-semibold">
          Six skills, one path
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SKILLS.map((s) => (
            <li key={s} className="rounded-xl border border-line bg-surface p-4">
              <p lang="de" className="font-medium">
                {SKILL_LABELS[s].de}
              </p>
              <p className="text-sm text-ink-muted">{SKILL_LABELS[s].en}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-16 max-w-2xl text-xs text-ink-muted">
        Practice material on this platform is original and aligned with the published structure of the Goethe-Zertifikat
        A1: Start Deutsch 1. It is not an official Goethe-Institut product, and practice scores are not official exam results.
      </p>
    </div>
  );
}
