"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeBlockAction, reviewVocabularyAction } from "@/app/actions/learning";
import AudioPlayer from "@/components/audio/AudioPlayer";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ContentImage from "@/components/learn/ContentImage";

const ARTICLE_TONE = { der: "text-brand-700", die: "text-danger-700", das: "text-success-700" };

function Word({ card }) {
  return (
    <p lang="de" className="text-3xl font-semibold tracking-tight">
      {card.article && <span className={ARTICLE_TONE[card.article]}>{card.article} </span>}
      {card.article ? card.display.slice(card.article.length + 1) : card.display}
    </p>
  );
}

// Flashcards with self-rating. Ratings update the learner's review schedule on the
// server (never mastery). In a lesson, the block is completed once every card was rated;
// the server verifies that before marking it done. In the CMS draft preview ratings stay
// in the browser: no review schedule or block completion is written.
export default function Flashcards({ cards, locale = "en", mode = "lesson", lessonId, blockKey, nextHref, preview = false }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const card = cards[index];

  function rate(result) {
    setError(null);
    startTransition(async () => {
      if (!preview) {
        const res = await reviewVocabularyAction({ vocabId: card.id, result });
        if (!res.ok) return setError(res.message);
      }
      if (index + 1 < cards.length) {
        setIndex(index + 1);
        setRevealed(false);
      } else {
        await finish();
      }
    });
  }

  async function finish() {
    if (preview) return router.push(nextHref);
    if (mode === "lesson") {
      const res = await completeBlockAction({ lessonId, blockKey });
      if (!res.ok) return setError(res.message);
      router.push(nextHref);
    } else {
      setFinished(true);
      router.refresh();
    }
  }

  if (finished) {
    return (
      <Alert tone="success">
        Review done. Words you knew come back later; the others come back soon.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted" aria-live="polite">
        Card {index + 1} of {cards.length}
      </p>
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm" data-card={card.id}>
        <Word card={card} />
        {card.plural && (
          <p lang="de" className="mt-1 text-sm text-ink-muted">
            Plural: {card.plural}
          </p>
        )}
        <div className="mt-4 flex justify-center">
          <AudioPlayer key={card.id} sources={[card.audio]} label="Listen" size="sm" />
        </div>
        {revealed ? (
          <div className="mt-5 space-y-2 border-t border-line pt-4">
            {/* Shown with the answer: a picture of the word would give the meaning away. */}
            {card.image && <ContentImage key={card.id} image={card.image} locale={locale} imgClassName="max-h-48" />}
            <LocalizedText as="p" text={card.meanings} prefer={locale} className="text-lg font-medium" data-testid="meaning" />
            {card.example && (
              <div className="text-sm">
                <LocalizedText as="p" text={{ de: card.example.de }} prefer="de" className="font-medium" />
                {(card.example[locale] || card.example.en) && (
                  <LocalizedText as="p" text={{ ...card.example, de: undefined }} prefer={locale} className="text-ink-muted" />
                )}
              </div>
            )}
            {card.notes && <LocalizedText as="p" text={card.notes} prefer={locale} className="text-xs text-ink-muted" />}
            {card.exampleAudio && (
              <div className="flex justify-center pt-1">
                <AudioPlayer key={`${card.id}-ex`} sources={[card.exampleAudio]} label="Listen to the example" size="sm" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-5 inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 font-medium hover:bg-canvas"
          >
            Show meaning
          </button>
        )}
      </div>
      {revealed && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => rate("unknown")}
            className="h-12 rounded-lg border border-line bg-surface font-medium hover:bg-canvas disabled:opacity-60"
          >
            Not yet
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => rate("known")}
            className="h-12 rounded-lg bg-brand-600 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            I knew it
          </button>
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
