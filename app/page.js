import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";

const STEPS = [
  { title: "Learn", text: "Short lessons: new words, a little grammar, then listening, reading, writing and speaking." },
  { title: "Practise", text: "Every exercise is checked right away, with the correct answers and explanations." },
  { title: "Review", text: "Words come back when they are due, and exercises you got wrong wait for a second try." },
  { title: "Prepare for Goethe", text: "Practise each exam part and take practice exams in the Goethe format." },
];

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:py-20">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">A1 · Goethe exam preparation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          <span lang="de">Deutsch lernen</span> – step by step.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          A guided path from your first <span lang="de">„Hallo!“</span> to exam-style practice. LGA tells you what to learn next, checks your answers and shows what to
          practise again.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard" className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
              Continue learning
            </Link>
          ) : (
            <>
              <Link href="/start" className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
                Start learning
              </Link>
              <Link href="/login" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 font-medium hover:bg-canvas">
                Sign in
              </Link>
            </>
          )}
        </div>
        {!user && <p className="mt-3 text-sm text-ink-muted">Free, and no account needed to start. Create one any time to keep your progress.</p>}
      </section>

      <section aria-labelledby="how-heading" className="mt-16">
        <h2 id="how-heading" className="text-lg font-semibold">
          How LGA works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line bg-surface p-4">
              <p className="font-medium">
                {i + 1}. {s.title}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="skills-heading" className="mt-12">
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
        Practice material on this platform is original and aligned with the published structure of the Goethe-Zertifikat A1: Start Deutsch 1. It is not an official
        Goethe-Institut product, and practice scores are not official exam results.
      </p>
    </div>
  );
}
