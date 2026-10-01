import { redirect } from "next/navigation";
import { getStartLevelCode } from "@/lib/services/journeyService";

export const metadata = { title: "Goethe Prep" };

// Goethe Prep opens at the learner's level (the first published one; A1 today).
export default async function GoethePage() {
  const code = await getStartLevelCode();
  if (!code) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Goethe Prep</h1>
        <p className="mt-2 text-ink-muted">The exam preparation opens once the first level has been published.</p>
      </div>
    );
  }
  redirect(`/goethe/${code.toLowerCase()}`);
}
