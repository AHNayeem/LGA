import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, loadLearnerState } from "@/lib/services/journeyService";
import { goetheSectionView } from "@/lib/learning/journey";
import { orNotFound } from "@/lib/pages";
import { GoetheSection } from "@/components/journey/GoetheViews";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Goethe Prep" };

// One Goethe exam part (hoeren, lesen, schreiben, sprechen): its practice exercises.
export default async function GoethePartPage({ params }) {
  const { level, part } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level));
  if (!structure.goethe.some((g) => g.key === part)) notFound();
  if (!user) return <GuestJourney page="goetheSection" arg={part} structure={structure} locale={locale} />;
  return <GoetheSection view={goetheSectionView(structure, await loadLearnerState(user, structure), part)} locale={locale} />;
}
