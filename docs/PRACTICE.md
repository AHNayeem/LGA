# Practice by topic

Status: implemented 2026-10-01 (Phase B of the German.net-inspired work, `GERMAN_NET_LEARNING_ANALYSIS.md`). Practice lets learners find and practise grammar topics and word topics outside the lesson that taught them. **It is a second way into the curriculum, not a second system.** It has no exercise engine, grading, attempts, progress or review state of its own. Every number follows the rules in `LEARNER.md`, "Metrics".

## Flow

```
/dashboard ── Practice card (weak topics, Grammar, Words) ──► /practice/<level>
                                                                 │
          ┌──────────────────────────────────────────────────────┤
          ▼                                                      ▼
/practice/<level>/grammar/<slug>                      /practice/<level>/words/<topic>
  status · "Practise now" · the rule ·                  flashcards (German → English or
  exercises with status · "Taught in …"                 English → German) · word list
          │
          ▼  /learn/<level>/<module>/<lesson>?block=<key>&from=grammar-<slug>
  the exercise in its lesson (same player, same grading, same progress)
  "← Back to grammar practice" above the step and after the result
```

Other ways in:
- **Review:** "Grammar topics that need practice", and the grammar names in each mistake group, link to the topic page.
- **Lesson result:** "Practise more" lists the lesson's grammar topics.
- **Wrong answers:** "Read the whole rule" leads to the lesson's grammar step.

**Navigation.** There is no Practice tab. `/practice` counts as part of **Learn** (`LEARNER_NAV` in `components/layout/LearnerNav.js`). To promote it later, add one entry there; no page changes are needed.

`?from=` (`lib/learning/returnLink.js`) accepts:

| Value | Return link |
|---|---|
| `goethe-<part>` | Goethe Prep part (unchanged) |
| `practice` | the Practice overview |
| `grammar-<slug>` | a grammar topic page (the slug must match `[a-z0-9-]`) |

Anything else is ignored.

## Which exercises practise a grammar topic

Exercises have no grammar field. The link is **derived** from the lesson, with one rule (`grammarLinkOf`, `lib/learning/topics.js`):

> An exercise practises a grammar topic ⇔ its skill is `grammar` **and** its lesson has **exactly one** grammar step, that topic.

| Case (A1 seed content) | Result |
|---|---|
| Grammar exercise in a lesson with one grammar step (58 of 83) | linked to that topic |
| Grammar exercise in a lesson with two grammar steps (7, in 3 lessons) | no topic: the lesson can't say which one |
| Grammar exercise in a lesson with no grammar step (18, mostly module tests) | no topic |
| Exercise of another skill (reading, listening …) | never linked |
| A topic taught in several lessons (none in A1 yet) | every such lesson contributes |

The same rule drives three things, so they always agree:
- the topic numbers
- the "Why?" rule after a wrong answer
- the explanation report

Unlinked exercises still count for the Grammar **skill**, as before.

Why no new field: setting a field on 272 exercises would be a content edit, and that sends approved content back to draft. If an explicit link is ever needed (e.g. for module tests), the smallest change is an optional `grammarIds` on exercises that overrides the derived link. It isn't in this phase.

## Topic numbers

Pure functions of `(structure, state)` (`grammarTopics`, `lib/learning/topics.js`). The server runs them for signed-in learners and the browser for guests, so both get identical numbers (`tests/integration/practice.test.js`).

| Number | Definition |
|---|---|
| **% right** (`performance`) | the topic's graded exercises the learner has attempted: Σ latest score scaled to the exercise's points ÷ their points. `null` with no attempt. The same formula as a skill's "% right" |
| **progress** | all the topic's graded exercises, unattempted = 0 (`scopeMastery`, the same as skill progress) |
| **target** (`threshold`) | the Grammar target of the topic's module (level rules with module overrides; A1: 75%) |
| **status** | `no_exercises` (no linked exercise: "Explanation only") · `new` (nothing attempted) · `needs_practice` (% right below the target) · `on_track` |
| **weak topic** | status `needs_practice`, weakest first. As with skills, unattempted exercises never make a topic weak, and the text always says how many exercises it rests on |
| **exercise status** | new · mistakes (latest < 100%) · passed · perfect, as in Goethe Prep |
| **suggested exercise** ("Practise now") | the first exercise whose latest attempt wasn't fully right; else the first not practised yet; else the first |

A topic can show "Needs practice" while its exercise shows "Passed". The exercise's pass mark (default 60%) completes the lesson step. The topic compares with the Grammar target (75%). Both are shown as text, with the target.

**Word topics** (`wordTopics`): the words of live lessons grouped by `vocabulary.topics`, in course order, with the count and how many of them are due. Labels come from `lib/content/vocabTopics.js` (UI labels; unknown slugs get a readable fallback).

## Where the data comes from

- `getLevelStructure(code, { vocabTopics })` (`journeyService` → `curriculumService.buildCurriculumStructure`) adds, read-only:
  - `grammar: { [id]: { slug, title, summary } }`: topics taught in the live lessons
  - `lessons[].grammarTopics`
  - with `vocabTopics: true` (Practice pages only): `vocabTopics: { [topic]: [vocabId] }`
- `practiceService.getGrammarTopicContent(structure, slug)`: the full explanation, only for a topic in the structure (otherwise 404).
- `practiceService.getTopicWordCards(structure, topic)`: the topic's flashcards through `learningService.reviewCards` (now with `article` and `notes`).

Draft content, and content of lessons learners can't open, never appears.

## Feedback after a wrong answer

`ExercisePlayer`, after checking:

1. The item's own `explanation`, when authored (unchanged).
2. Otherwise, if the exercise practises the lesson's grammar topic (rule above): **"Why? The rule: <topic>"**. It shows the topic's summary and "Read the whole rule" (the lesson's grammar step). It is open for the first such item and collapsed for the others.
3. Otherwise: only the correct answer. No rule is invented, and nothing is generated at runtime.

The rule comes from the lesson data the page already has (the grammar step), so there is no new request. It shows only after checking.

## Try again

`lib/exercises/retry.js` (`retryState`):
- After a result with mistakes, the items graded **fully right** keep their answer. They are locked and marked "✓ Correct · kept".
- Wrong, partly right (e.g. 2 of 3 pairs), unanswered and ungraded items are cleared, and the focus moves to the first of them.
- "Clear all answers" starts from scratch.
- After a perfect result or ungraded practice, nothing is kept.

The retry is submitted and graded **as a whole** on the server. Kept answers are scored like any other, the attempt stores every item, and scoring, pass marks, attempts and progress are unchanged.

## Flashcards in both directions

`Flashcards` has a **German → English / English → German** switch:
- **English → German** shows the meaning (and picture) first, plus "Say it with its article" for nouns. The German word, its audio and the example appear only after "Show the German word".
- The direction is a per-browser display preference (`localStorage["lga:flashcards:direction"]`). It is not learner state.
- Both directions **self-rate** the same word into the same Leitner schedule (`srs.reviewCard`), exactly as before. Nothing is typed or checked, so there is no normalisation (umlauts, articles, plurals, alternatives) that could reject a valid answer. Typed recall is P1.
- In a word topic (`mode="practice"`) the deck is the whole topic and can be gone through again. Ratings go into the account (signed in) or the browser (guest), like any rating, and never count for any score.

## Explanation report (content QA)

`lib/content/explanationReport.js` and `explanationReportService.getExplanationReport` (content reviewers only). It reads **stored** content in every state except archived. It has two front ends:

- `bun run content:check -- --explanations [--level a1] [--json] [--missing-only]`
- `/admin/explanations` (not in the admin navigation)

Per exercise it shows module, lesson, step, exercise, skill, item types, scored items explained, and what a wrong answer shows:

| Status | Meaning |
|---|---|
| `complete` | every scored item explained |
| `fallback` | the grammar rule covers the missing ones |
| `missing` | correct answer only, with the reason: not a grammar exercise / no grammar topic / several topics |
| `ungraded` | speaking; needs nothing |

"Explained" means an explanation exists. Its quality is a reviewer's call. The report is informational and never fails the check.

## Tests

| File | Covers |
|---|---|
| `tests/unit/topics.test.js` | the link rule and its reasons; topics in course order; several lessons contributing; ambiguous and no-topic lessons; no attempt, partial attempts, latest attempt, module targets; agreement with the Grammar skill; guest = stored state; weak ordering and the suggestion; dashboard/Review summaries; views and empty states; labels; return links (including rejected values); retry (kept, wrong, partly right, unanswered, perfect, ungraded); the explanation report |
| `tests/integration/practice.test.js` | live content only (an unpublished lesson takes its topic and words with it, drafts give 404); topic explanation and word cards; malformed slugs; ratings in the normal review schedule; identical guest and signed-in topic numbers on real answers; Practice reads write nothing; the report on draft content and its permission |
| `tests/e2e/practice.spec.js` (desktop + Pixel 7) | dashboard → Practice → topic → exercise → back; "Why?" for an item without an explanation, not for one with it, never for reading; Try again keeps 4 of 6, focuses the first empty item, full points after; weak topic on dashboard, Practice and Review; both card directions and the remembered choice; signed-in flow; no sideways scrolling on phones |

## Known limitations

- Grammar exercises in lessons with two grammar topics (3 A1 lessons) and in module tests count for no topic. The report lists them.
- Word topic labels are UI labels in code. A topic added in the CMS shows a fallback label until it gets one.
- No mixed "quick practice" across exercises: every exercise is still practised as its lesson step (the only write path). A cross-exercise session would need a grading path outside lessons (P2 in the analysis).
- The flashcard direction is per browser, not per account.
