import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, loadLearnerState } from "@/lib/services/journeyService";
import { levelView } from "@/lib/learning/journey";
import { orNotFound } from "@/lib/pages";
import LevelOverview from "@/components/journey/LevelOverview";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Level" };

export default async function LevelPage({ params }) {
  const { level } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level));
  if (!user) return <GuestJourney page="level" structure={structure} locale={locale} />;
  return <LevelOverview view={levelView(structure, await loadLearnerState(user, structure))} locale={locale} />;
}
