import { getCurrentUser } from "@/lib/auth/dal";
import { getReviewQueue } from "@/lib/services/learningService";
import { getLevelStructure, getStartLevelCode, loadLearnerState } from "@/lib/services/journeyService";
import { reviewView } from "@/lib/learning/journey";
import Flashcards from "@/components/learn/Flashcards";
import ReviewView from "@/components/journey/ReviewView";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Review" };

// Words due and exercises to practise again, for signed-in learners and guests.
export default async function ReviewPage() {
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const code = await getStartLevelCode();
  if (!code) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <p className="mt-2 text-ink-muted">Nothing to review yet: no lessons have been published.</p>
      </div>
    );
  }
  const structure = await getLevelStructure(code);
  if (!user) return <GuestJourney page="review" structure={structure} locale={locale} />;

  const [state, queue] = await Promise.all([loadLearnerState(user, structure), getReviewQueue(user, { limit: 20 })]);
  const deck = queue.cards.length > 0 ? <Flashcards key={queue.cards.map((c) => c.id).join()} cards={queue.cards} locale={locale} mode="review" /> : null;
  return <ReviewView view={reviewView(structure, state)} deck={deck} locale={locale} />;
}
