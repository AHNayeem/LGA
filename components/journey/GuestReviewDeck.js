"use client";

import { useEffect, useState } from "react";
import { guestVocabularyCardsAction } from "@/app/actions/guest";
import Flashcards from "@/components/learn/Flashcards";
import Alert from "@/components/ui/Alert";

const DECK_SIZE = 20;

// A guest's review deck: the browser knows which words are due (its own review state) and
// asks the server for those published flashcards. The deck is fixed when it opens, so
// rating a card (which changes what is due) doesn't reload it mid-session.
export default function GuestReviewDeck({ dueIds, locale }) {
  const [ids] = useState(() => dueIds.slice(0, DECK_SIZE));
  const [cards, setCards] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    guestVocabularyCardsAction({ vocabIds: ids }).then((res) => {
      if (!active) return;
      if (res.ok) setCards(res.data.cards);
      else setError(res.message);
    });
    return () => {
      active = false;
    };
  }, [ids]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!cards) return <p className="text-sm text-ink-muted">Loading your words…</p>;
  if (cards.length === 0) return <p className="text-sm text-ink-muted">These words are not available right now.</p>;
  return <Flashcards key={ids.join()} cards={cards} locale={locale} mode="review" learner="guest" />;
}
