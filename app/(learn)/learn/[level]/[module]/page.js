import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, loadLearnerState } from "@/lib/services/journeyService";
import { moduleView } from "@/lib/learning/journey";
import { orNotFound } from "@/lib/pages";
import ModuleOverview from "@/components/journey/ModuleOverview";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Module" };

export default async function ModulePage({ params }) {
  const { level, module: moduleSlug } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level));
  if (!structure.modules.some((m) => m.slug === moduleSlug)) notFound();
  if (!user) return <GuestJourney page="module" arg={moduleSlug} structure={structure} locale={locale} />;
  return <ModuleOverview view={moduleView(structure, await loadLearnerState(user, structure), moduleSlug)} locale={locale} />;
}
