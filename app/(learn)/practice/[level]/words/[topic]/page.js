import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLevelStructure } from "@/lib/services/journeyService";
import { getTopicWordCards } from "@/lib/services/practiceService";
import { practiceHref } from "@/lib/learning/topics";
import { vocabTopicLabel } from "@/lib/content/vocabTopics";
import { orNotFound } from "@/lib/pages";
import Flashcards from "@/components/learn/Flashcards";
import WordList from "@/components/learn/WordList";

export const metadata = { title: "Word practice" };

// The words of one topic as flashcards, in both directions. Ratings go into the same review
// schedule as everywhere else (signed in: the account; guest: this browser), so a word
// practised here comes back in Review like any other. Ratings never count for any score.
export default async function WordTopicPage({ params }) {
  const { level, topic } = await params;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const structure = await orNotFound(getLevelStructure(level, { vocabTopics: true }));
  const { slug, cards } = await orNotFound(getTopicWordCards(structure, topic));
  const label = vocabTopicLabel(slug);
  const code = structure.level.code;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={practiceHref(code)} className="hover:underline">
          Practice
        </Link>
        {" › "}
        <Link href={`${practiceHref(code)}#words`} className="hover:underline">
          Words
        </Link>
      </nav>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight" lang="de">
        {label.de}
      </h1>
      <p className="text-ink-muted">
        {label.en && `${label.en} · `}
        {cards.length} {cards.length === 1 ? "word" : "words"}
      </p>
      <p className="mt-2 text-sm text-ink-muted">Say the word to yourself, then check. Words you know come back less often in Review.</p>
      <div className="mt-6 space-y-6">
        <Flashcards key={slug} cards={cards} locale={locale} mode="practice" learner={user ? "user" : "guest"} backHref={`${practiceHref(code)}#words`} />
        <WordList cards={cards} locale={locale} label="All words in this topic" />
      </div>
    </div>
  );
}
