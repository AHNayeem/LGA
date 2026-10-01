import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, loadLearnerState } from "@/lib/services/journeyService";
import { goetheView } from "@/lib/learning/journey";
import { orNotFound } from "@/lib/pages";
import { GoetheOverview } from "@/components/journey/GoetheViews";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Goethe Prep" };

export default async function GoetheLevelPage({ params }) {
  const { level } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level));
  if (!user) return <GuestJourney page="goethe" structure={structure} locale={locale} />;
  return <GoetheOverview view={goetheView(structure, await loadLearnerState(user, structure))} locale={locale} />;
}
