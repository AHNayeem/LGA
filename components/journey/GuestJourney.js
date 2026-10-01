"use client";

import { useGuestState } from "@/lib/learning/guestStore";
import { goetheSectionView, goetheView, homeView, levelView, moduleView, reviewView } from "@/lib/learning/journey";
import HomeView from "@/components/journey/HomeView";
import LevelOverview from "@/components/journey/LevelOverview";
import ModuleOverview from "@/components/journey/ModuleOverview";
import ReviewView from "@/components/journey/ReviewView";
import GuestReviewDeck from "@/components/journey/GuestReviewDeck";
import { GoetheOverview, GoetheSection } from "@/components/journey/GoetheViews";
import { grammarTopicView, practiceView } from "@/lib/learning/topics";
import PracticeOverview from "@/components/practice/PracticeOverview";
import GrammarTopicPractice from "@/components/practice/GrammarTopicPractice";

// Guests: the page sends the level structure (published content, no learner data) and
// this component computes the page's view in the browser from the guest's own state,
// with the same functions the server uses for signed-in learners
// (lib/learning/journey.js). Until the browser state is read, a placeholder shows, so no
// made-up numbers ever appear.
const PAGES = {
  home: (s, st) => ({ view: homeView(s, st), Component: HomeView }),
  level: (s, st) => ({ view: levelView(s, st), Component: LevelOverview }),
  module: (s, st, arg) => ({ view: moduleView(s, st, arg), Component: ModuleOverview }),
  review: (s, st) => ({ view: reviewView(s, st), Component: ReviewView }),
  goethe: (s, st) => ({ view: goetheView(s, st), Component: GoetheOverview }),
  goetheSection: (s, st, arg) => ({ view: goetheSectionView(s, st, arg), Component: GoetheSection }),
  practice: (s, st) => ({ view: practiceView(s, st), Component: PracticeOverview }),
  grammarTopic: (s, st, arg) => ({ view: grammarTopicView(s, st, arg), Component: GrammarTopicPractice }),
};

// `props`: extra, state-independent props for the page component (e.g. a grammar topic's
// explanation), passed through unchanged.
export default function GuestJourney({ page, structure, arg = null, locale = "en", props = {} }) {
  const state = useGuestState();
  if (!state) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <p className="text-sm text-ink-muted">Loading your progress…</p>
      </div>
    );
  }
  const { view, Component } = PAGES[page](structure, state, arg);
  if (!view) return null;
  const extra = page === "review" ? { deck: <GuestReviewDeck dueIds={view.due.ids} locale={locale} /> } : {};
  return <Component view={view} locale={locale} guest {...props} {...extra} />;
}
