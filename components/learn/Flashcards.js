"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeBlockAction, reviewVocabularyAction } from "@/app/actions/learning";
import { updateGuestState } from "@/lib/learning/guestStore";
import { applyBlockDone, applyVocabReview } from "@/lib/learning/state";
import AudioPlayer from "@/components/audio/AudioPlayer";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ActionError from "@/components/learn/ActionError";
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

// Direction of the cards: German → English (recognise the word) or English → German
// (recall the word with its article). A per-browser display preference, not learner
// progress: it only changes which side shows first, never the rating or the schedule.
export const DIRECTIONS = Object.freeze({ deEn: "de-en", enDe: "en-de" });
const DIRECTION_KEY = "lga:flashcards:direction";
const directionListeners = new Set();
let directionOverride = null; // the choice made on this page when storage is blocked

function readDirection() {
  if (directionOverride) return directionOverride;
  try {
    return window.localStorage.getItem(DIRECTION_KEY) === DIRECTIONS.enDe ? DIRECTIONS.enDe : DIRECTIONS.deEn;
  } catch {
    return DIRECTIONS.deEn;
  }
}

function saveDirection(value) {
  directionOverride = value;
  try {
    window.localStorage.setItem(DIRECTION_KEY, value);
  } catch {
    // Storage blocked: the choice still applies on this page.
  }
  for (const l of directionListeners) l();
}

function subscribeDirection(listener) {
  directionListeners.add(listener);
  return () => directionListeners.delete(listener);
}

// German → English during server rendering and hydration, then the stored choice.
function useDirection() {
  return useSyncExternalStore(subscribeDirection, readDirection, () => DIRECTIONS.deEn);
}

function DirectionSwitch({ direction, onChange }) {
  const option = (value, label) => (
    <button
      type="button"
      aria-pressed={direction === value}
      onClick={() => onChange(value)}
      className={`h-9 rounded-md px-3 text-sm font-medium ${direction === value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Card direction" className="inline-flex rounded-lg bg-canvas p-1" data-testid="direction-switch">
      {option(DIRECTIONS.deEn, "German → English")}
      {option(DIRECTIONS.enDe, "English → German")}
    </div>
  );
}

function Details({ card, locale }) {
  return (
    <>
      {card.example && (
        <div className="text-sm">
          <LocalizedText as="p" text={{ de: card.example.de }} prefer="de" className="font-medium" />
          {(card.example[locale] || card.example.en) && <LocalizedText as="p" text={{ ...card.example, de: undefined }} prefer={locale} className="text-ink-muted" />}
        </div>
      )}
      {card.notes && <LocalizedText as="p" text={card.notes} prefer={locale} className="text-xs text-ink-muted" />}
      {card.exampleAudio && (
        <div className="flex justify-center pt-1">
          <AudioPlayer key={`${card.id}-ex`} sources={[card.exampleAudio]} label="Listen to the example" size="sm" />
        </div>
      )}
    </>
  );
}

// Flashcards with self-rating. Ratings update the learner's review schedule (never
// mastery): on the server for a signed-in learner (`learner` "user"), in this browser for
// a guest ("guest"), with the same Leitner rule. In a lesson, the block is completed once
// every card was rated; the server verifies that for signed-in learners. In the CMS
// draft preview ("preview") nothing is written anywhere.
//   mode: "lesson" (a vocabulary step) | "review" (the review deck) | "practice" (a word
//         topic in Practice: like review, but the whole topic, and it can be gone through again)
//   backHref: where "practice" offers to go when the deck is done
// Both directions rate the same word with the same rule (lib/learning/srs.js): the
// learner says whether they knew it, nothing is typed or checked.
export default function Flashcards({ cards, locale = "en", mode = "lesson", lessonId, blockKey, nextHref, learner = "user", lessonBlocks = null, onFinished = null, backHref = null }) {
  const preview = learner === "preview";
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const direction = useDirection();
  const toGerman = direction === DIRECTIONS.enDe;

  const card = cards[index];

  function rate(result) {
    setError(null);
    startTransition(async () => {
      if (learner === "guest") {
        updateGuestState((s) => applyVocabReview(s, { vocabId: card.id, result }));
      } else if (!preview) {
        const res = await reviewVocabularyAction({ vocabId: card.id, result });
        if (!res.ok) return setError(res);
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
    if (learner === "guest") {
      if (mode === "lesson") {
        updateGuestState((s) => applyBlockDone(s, { lessonId, blockKey, blocks: lessonBlocks }));
        return router.push(nextHref);
      }
      setFinished(true);
      onFinished?.();
      return;
    }
    if (mode === "lesson") {
      const res = await completeBlockAction({ lessonId, blockKey });
      if (!res.ok) return setError(res);
      router.push(nextHref);
    } else {
      setFinished(true);
      onFinished?.();
      if (mode === "review") router.refresh();
    }
  }

  function restart() {
    setIndex(0);
    setRevealed(false);
    setFinished(false);
  }

  if (finished && mode === "practice") {
    return (
      <div className="space-y-3">
        <Alert tone="success">
          You went through all {cards.length} {cards.length === 1 ? "word" : "words"}. Words you knew come back later in Review; the others come back soon.
        </Alert>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={restart} className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
            Go through them again
          </button>
          {backHref && (
            <Link href={backHref} className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
              More word topics
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <Alert tone="success">
        Review done. Words you knew come back later; the others come back soon.
      </Alert>
    );
  }

  const german = (
    <>
      <Word card={card} />
      {card.plural && (
        <p lang="de" className="mt-1 text-sm text-ink-muted">
          Plural: {card.plural}
        </p>
      )}
      <div className="mt-4 flex justify-center">
        <AudioPlayer key={card.id} sources={[card.audio]} label="Listen" size="sm" />
      </div>
    </>
  );
  const meaning = <LocalizedText as="p" text={card.meanings} prefer={locale} className="text-lg font-medium" data-testid="meaning" />;
  const revealButton = (label) => (
    <button type="button" onClick={() => setRevealed(true)} className="mt-5 inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 font-medium hover:bg-canvas">
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted" aria-live="polite">
          Card {index + 1} of {cards.length}
        </p>
        <DirectionSwitch
          direction={direction}
          onChange={(d) => {
            saveDirection(d);
            setRevealed(false);
          }}
        />
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm" data-card={card.id} data-direction={direction}>
        {toGerman ? (
          <>
            {/* English → German: the meaning (and its picture) first. The German word, its
                audio and the example would give the answer away, so they come with it. */}
            {card.image && <ContentImage key={card.id} image={card.image} locale={locale} imgClassName="max-h-48" />}
            {meaning}
            {card.pos === "noun" && <p className="mt-1 text-sm text-ink-muted">Say it with its article: der, die or das.</p>}
            {revealed ? (
              <div className="mt-5 space-y-2 border-t border-line pt-4" data-testid="answer">
                {german}
                <Details card={card} locale={locale} />
              </div>
            ) : (
              revealButton("Show the German word")
            )}
          </>
        ) : (
          <>
            {german}
            {revealed ? (
              <div className="mt-5 space-y-2 border-t border-line pt-4" data-testid="answer">
                {/* Shown with the answer: a picture of the word would give the meaning away. */}
                {card.image && <ContentImage key={card.id} image={card.image} locale={locale} imgClassName="max-h-48" />}
                {meaning}
                <Details card={card} locale={locale} />
              </div>
            ) : (
              revealButton("Show meaning")
            )}
          </>
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
      <ActionError error={error} />
    </div>
  );
}
