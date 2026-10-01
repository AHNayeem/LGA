import { redirect } from "next/navigation";
import { getStartLevelCode } from "@/lib/services/journeyService";
import { practiceHref } from "@/lib/learning/topics";

export const metadata = { title: "Practice" };

// Practice opens at the learner's level (the first published one; A1 today).
export default async function PracticePage() {
  const code = await getStartLevelCode();
  if (!code) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="mt-2 text-ink-muted">Practice opens once the first lessons have been published.</p>
      </div>
    );
  }
  redirect(practiceHref(code));
}
