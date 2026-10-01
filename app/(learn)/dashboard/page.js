import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, getStartLevelCode, loadLearnerState } from "@/lib/services/journeyService";
import { homeView } from "@/lib/learning/journey";
import Alert from "@/components/ui/Alert";
import HomeView from "@/components/journey/HomeView";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Learn" };

// The learner home for everyone. Signed-in learners' views are computed here from their
// stored state; guests' in the browser from their own (GuestJourney), with the same code.
export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();
  const { error } = await searchParams;
  const locale = user?.uiLanguage ?? "en";
  const code = await getStartLevelCode();

  const forbidden = error === "forbidden" && (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6">
      <Alert tone="error">You don&apos;t have access to that page.</Alert>
    </div>
  );

  if (!code) {
    return (
      <>
        {forbidden}
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{user ? `Hallo, ${user.name}!` : "Willkommen!"}</h1>
          <p className="mt-2 text-ink-muted">No level has been approved and published yet. The first lessons are being prepared – please come back soon.</p>
        </div>
      </>
    );
  }

  const structure = await getLevelStructure(code);
  if (!user) {
    return (
      <>
        {forbidden}
        <GuestJourney page="home" structure={structure} locale={locale} />
      </>
    );
  }
  const state = await loadLearnerState(user, structure);
  return (
    <>
      {forbidden}
      <HomeView view={homeView(structure, state)} name={user.name} locale={locale} />
    </>
  );
}
