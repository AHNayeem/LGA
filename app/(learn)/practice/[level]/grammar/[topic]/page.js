import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure, loadLearnerState } from "@/lib/services/journeyService";
import { getGrammarTopicContent } from "@/lib/services/practiceService";
import { grammarTopicView } from "@/lib/learning/topics";
import { orNotFound } from "@/lib/pages";
import GrammarTopicPractice from "@/components/practice/GrammarTopicPractice";
import GuestJourney from "@/components/journey/GuestJourney";

export const metadata = { title: "Grammar practice" };

// One grammar topic: the rule, its exercises with the learner's results, and where it is
// taught. Only topics taught in a lesson learners can open exist here (404 otherwise).
export default async function GrammarTopicPage({ params }) {
  const { level, topic } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level));
  const content = await orNotFound(getGrammarTopicContent(structure, topic));
  if (!user) return <GuestJourney page="grammarTopic" arg={topic} structure={structure} locale={locale} props={{ content }} />;
  const view = grammarTopicView(structure, await loadLearnerState(user, structure), topic);
  return <GrammarTopicPractice view={view} content={content} locale={locale} />;
}
