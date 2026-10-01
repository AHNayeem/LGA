import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, getStartLevelCode } from "@/lib/services/journeyService";
import Onboarding from "@/components/journey/Onboarding";

export const metadata = { title: "Start learning" };

// First-time setup, for guests and signed-in learners alike: goal and starting point.
export default async function StartPage() {
  const user = await getCurrentUser();
  const code = await getStartLevelCode();
  if (!code) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Start learning</h1>
        <p className="mt-2 text-ink-muted">The first lessons are being prepared. Please come back soon.</p>
      </div>
    );
  }
  const structure = await getLevelStructure(code);
  const modules = structure.modules
    .filter((m) => m.lessons.length > 0)
    .map((m) => ({ slug: m.slug, order: m.order, title: m.title, description: m.description }));
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <p lang="de" className="text-sm font-medium text-brand-700">
        Willkommen bei LGA
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s set up your German learning</h1>
      <p className="mt-1 text-ink-muted">Two quick questions, then you start. Nothing to install, no account needed.</p>
      <div className="mt-6">
        <Onboarding levelCode={structure.level.code} levelTitle={structure.level.title} modules={modules} signedIn={Boolean(user)} initial={user?.learningProfile ?? null} />
      </div>
      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="text-ink-muted underline">
          Skip and start with the first lesson
        </Link>
      </p>
    </div>
  );
}
