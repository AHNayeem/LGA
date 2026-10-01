import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, loadLearnerState } from "@/lib/services/journeyService";
import { practiceView } from "@/lib/learning/topics";
import { orNotFound } from "@/lib/pages";
import PracticeOverview from "@/components/practice/PracticeOverview";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Practice" };

// Grammar topics and word topics of a level (docs/PRACTICE.md). Signed-in learners' numbers
// are computed here, guests' in the browser from their own state, with the same code.
export default async function PracticeLevelPage({ params }) {
  const { level } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level, { vocabTopics: true }));
  if (!user) return <GuestJourney page="practice" structure={structure} locale={locale} />;
  return <PracticeOverview view={practiceView(structure, await loadLearnerState(user, structure))} locale={locale} />;
}
