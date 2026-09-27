import Link from "next/link";
import { requireUserPage } from "@/lib/auth/dal";
import { getReviewQueue } from "@/lib/services/learningService";
import Flashcards from "@/components/learn/Flashcards";

export const metadata = { title: "Vocabulary review" };

export default async function ReviewPage() {
  const user = await requireUserPage("/review");
  const locale = user.uiLanguage ?? "en";
  const queue = await getReviewQueue(user, { limit: 20 });

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        <span lang="de">Wiederholen</span> · Review
      </h1>
      <p className="mt-1 text-ink-muted">
        {queue.dueCount > 0
          ? `${queue.dueCount} ${queue.dueCount === 1 ? "word is" : "words are"} due. Words you know come back less often.`
          : "Nothing to review right now."}
      </p>
      <div className="mt-6">
        {queue.cards.length > 0 ? (
          <Flashcards key={queue.cards.map((c) => c.id).join()} cards={queue.cards} locale={locale} mode="review" />
        ) : (
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
            Back to the dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
