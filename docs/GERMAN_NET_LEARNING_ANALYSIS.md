# German.net learning analysis (Phase A)

Status: Phase A research 2026-10-01. Phase B (P0) implemented the same day, see [PRACTICE.md](PRACTICE.md) and "Phase B: decisions that differ" at the end.

This file compares the public learning experience of german.net with LGA, and recommends what LGA should adapt. German.net is used as a **UX and learning-pattern reference only**. No text, exercises, UI, layouts or assets are copied. Every learner-facing item that comes out of this work is original LGA content, written to the A1 curriculum and the Goethe format (`REFERENCE-ANALYSIS.md`).

Related: `ARCHITECTURE.md` (engine, content model), `LEARNER.md` (journey, metrics, guest state), `CMS.md`, `CURRICULUM-A1.md`, `EXAMS.md`.

## How this was researched

- **German.net:** public pages fetched 2026-10-01: home, `/exercises/` and topic pages (accusative, articles, present tense), `/reading/` and one A1 text, `/vocabulary/`, `/vocabulary/lists/`, the level 1 vocabulary trainer, `/verbs/conjugation/`. Only what the pages show without signing in or answering was observed. **What german.net shows after "Check answers" (marking, explanations) was not observed** and is not relied on below.
- **LGA:** the docs above plus the code: `lib/exercises/*`, `lib/learning/journey.js`, `lib/learning/srs.js`, `lib/validation/content.js`, `components/exercises/*`, `components/learn/*`, `components/journey/*`, the learner routes and the A1 seed content. Content counts come from the seed files (`content/curriculum/**`), not a live database.

### LGA A1 in numbers (seed content)

| | Count |
|---|---|
| Modules / lessons | 12 / 65 (11 of them module-review lessons) |
| Exercises / items | 272 / 1,554 (mcq 572, text_input 491, true_false 261, speak_prompt 90, order 79, match 61) |
| Exercises by skill | grammar 83, vocabulary 52, listening 50, reading 42, speaking 25, writing 20 |
| Items with an authored `explanation` | **140 of 1,554 (9%)**; none for order, match, speak_prompt |
| Words | 622, all with ≥1 topic (68 topic slugs), 563 with an example sentence, 86 verbs |
| Grammar topics | 50, with 67 tables |
| Texts (`stimulus.text`) | 56 (dialogue 23, message 16, email 15, form 10, ad 6, profile 5, sign 4) |
| Practice exams | 1 |

All of it is `ai_generated` and starts as draft; release to learners needs human review (`ARCHITECTURE.md`, content lifecycle).

---

## A. German.net patterns

Each row: what german.net does → why it helps → does LGA have it → how LGA should do it.

### A1. Learning areas as entry points

| | |
|---|---|
| **German.net** | Four top-level areas in the main navigation: Reading, Exercises (grammar), Vocabulary, Conjugation. The home page sends learners straight into one of them. |
| **Why it helps** | A learner who knows what they want ("I keep getting the accusative wrong") finds it in two clicks. Areas map to how learners think about German. |
| **LGA** | **No.** Navigation is Learn · Review · Goethe Prep · Account. Grammar topics, words and texts are only reachable inside the lesson that teaches them. There is no learner grammar index, word list or reading list. |
| **LGA should** | Add one **Practice** area that indexes the *existing* content by grammar topic, word topic and text, and sends the learner into the existing lesson step (as Goethe Prep already does with `?from=goethe-<part>`). It is a second door into the curriculum, not a second curriculum. See C, P0-1. |

### A2. Topic-based grammar practice

| | |
|---|---|
| **German.net** | 12 grammar categories (tenses, cases, articles, prepositions, …), each with topics, each topic with one or more numbered sheets. A short explanation sits above the exercise. Progress "N of M sheets started" per topic. |
| **Why it helps** | Isolates one rule at a time; lets the learner repeat a single weak rule; makes coverage visible. |
| **LGA** | **Partly.** 50 grammar topics with sections, tables and examples (`grammarTopics`), but only shown as a lesson step. Exercises are **not linked to grammar topics**: the only link is that a lesson contains a `grammar` block and some `practice` blocks. |
| **LGA should** | Derive "which grammar topic does this exercise practise" from the lesson (the lesson's grammar blocks), with an optional explicit override on the exercise for module-review lessons and mixed lessons. Then a grammar topic page can show: the explanation (reused `GrammarTopic`), the exercises that practise it in course order, and the learner's result on it. See C, P0-1 and P0-2. |

### A3. Short explanation, then focused exercises

| | |
|---|---|
| **German.net** | Topic pages open with a few sentences and an example, then the sheet. Theory and practice are on one page. |
| **Why it helps** | Low reading load before practising; the rule is visible while answering. |
| **LGA** | **Yes, inside lessons** (grammar step, then practice steps). Not available when re-practising: from Review the learner lands on the exercise step without the rule. |
| **LGA should** | When an exercise is opened from Review or Practice, show a collapsed "Rule: <grammar topic>" panel above it (the topic's summary plus a link to the full topic). No new content needed. See C, P0-3. |

### A4. Batch check with a "Check answers" button

| | |
|---|---|
| **German.net** | All questions of a sheet on one page (dropdowns, radio buttons or typed gaps), one "Check answers" button at the end, a percentage, "Try again". |
| **Why it helps** | Fast; mirrors a worksheet; the learner reviews all answers together. |
| **LGA** | **Yes, already the same model.** Items render as one list, "Check answers" grades on the server, the result bar shows points and pass/fail, each item shows ✓/✗ with text, the correct answer and (if authored) an explanation. |
| **LGA should** | Keep it. It is also the Goethe exam format. Do **not** switch to per-question instant checking by default (see P2). Improve what happens *after* the check: see A5, A6. |

### A5. Retry flow

| | |
|---|---|
| **German.net** | "Try again" on the sheet. |
| **Why it helps** | Immediate second attempt while the rule is fresh. |
| **LGA** | **Partly.** "Try again" clears **all** answers (`ExercisePlayer.js`, `setAnswers({})`). A learner with 9/10 right must redo all ten. |
| **LGA should** | "Try again" keeps the correct answers (shown as locked, marked ✓) and clears only the wrong ones. The whole exercise is still submitted and graded on the server, so scoring, attempts and mastery are unchanged. See C, P0-4. |

### A6. Explanations and hints

| | |
|---|---|
| **German.net** | Short rule text at the top of the topic. Per-question explanations after checking were not observable (see "How this was researched"). |
| **Why it helps** | Learners learn from a wrong answer only if they see *why*. |
| **LGA** | **Engine yes, content mostly no.** Every item type supports an optional `explanation`, shown after checking. Only 9% of items have one; wrong `text_input` answers get no diagnostic beyond the correct form. No hint mechanism at all. |
| **LGA should** | (1) Make missing explanations visible to authors (`content:check`, CMS list column) and fall back to the linked grammar topic's rule when an item has none (P0-3). (2) Add optional hints, at most two per item, shown one at a time before checking (P1-1). |

### A7. Progressive sheets / levels

| | |
|---|---|
| **German.net** | Sheets numbered 1…N per topic, simple to advanced (e.g. present tense: basics, then irregular, then separable and modal). Vocabulary levels that must be passed (recognition, then active use) before the next opens. |
| **Why it helps** | A clear next step inside a topic; recognition before production. |
| **LGA** | **Yes, by lesson design** (practice → practice → reading/listening → speaking/writing; module-review lessons: mini_test → mastery_check). Not visible outside lessons; no difficulty metadata. |
| **LGA should** | On a topic page, order exercises by course order and label each with its block type ("Practice", "Test", "Check"), which already expresses the progression. No difficulty field and no gating (LGA is not freemium and should not lock content). See P1-4. |

### A8. Topic vocabulary lists with two directions

| | |
|---|---|
| **German.net** | Thematic lists (family, animals, numbers, verbs for beginners …) with word count and a difficulty marker. Two trainers per list: **passive** (recognise: German → choose the translation from 6) and **active** (type the German). One word at a time, keyboard shortcuts 1–6. |
| **Why it helps** | Topic grouping aids memory; recognition then production; typing trains spelling, articles and plurals. |
| **LGA** | **Data yes, UX no.** 622 words, every one with `topics` (68 slugs), article, plural, example, TTS audio, optional image. But learners only see words inside a lesson step or in Review when due. Flashcards are **German → English only, self-rated**. No practice by topic, no practice when nothing is due, no typing. |
| **LGA should** | Word topics in the Practice area (P0-1), reusing `Flashcards`. Add **direction English → German** to the flashcards (P0-5). Add an optional **typed** mode where the learner types the German word with article (P1-2). Never let these feed mastery: vocabulary review stays self-rated (`LEARNER.md`). |

### A9. Graded reading by level

| | |
|---|---|
| **German.net** | Texts by CEFR level, then topic. Each card: level, title, one-line teaser. A text page: ~130 words for A1, audio, 5 multiple-choice questions, check, "Try again", related texts. |
| **Why it helps** | Lots of comprehensible input; short texts are finishable; related texts keep the learner reading. |
| **LGA** | **Content yes, library no.** 56 texts inside exercises, typed by `textKind` (email, message, sign, ad, dialogue, …) which already matches Goethe Lesen formats. They are only reachable as lesson steps or via Goethe Prep (Lesen). |
| **LGA should** | A reading list in the Practice area: every published exercise with a text, grouped by module (= topic) and filterable by text kind, each showing which Goethe Lesen Teil the format matches. Opens the existing exercise step. See P1-3. Writing new, longer A1 texts is Phase D content work, not UX. |

### A10. Verb conjugation trainer

| | |
|---|---|
| **German.net** | Choose a tense; a random verb in the infinitive; type the form for each person; check; correct forms shown. |
| **Why it helps** | High-frequency, rule-bound, cheap to drill; A1 errors are often conjugation errors. |
| **LGA** | **No.** No verb-forms data (conjugation appears as free text in some word `notes`), no conjugation exercise type, no verb tables outside grammar sections. Conjugation is practised through `text_input` gap items. |
| **LGA should** | First add optional verb forms to verb vocabulary (Präsens; Perfekt with auxiliary and participle, matching A1 module 10) and show them on the word card (P1-5). A drill built on that data is P2: it needs a grading path that does not belong to a lesson, which LGA does not have today. |

### A11. Visible progress per topic

| | |
|---|---|
| **German.net** | "Topic progress", "N of M sheets started", done/undone filters on reading, test-result icons on vocabulary lists. |
| **Why it helps** | Learners see what is covered and what is left. |
| **LGA** | **Per lesson, module, skill and Goethe part**, defined precisely in `LEARNER.md`. Nothing per grammar topic or word topic. Weakness is per skill only ("Grammar: below the LGA target"), which does not tell the learner *which* grammar. |
| **LGA should** | Per grammar topic: "% right" on the attempted exercises that practise it, with the same rules as skills (latest attempt, unattempted never weak, always with the number of exercises it rests on). Shown in Review, the lesson result and the topic page. See P0-2. |

### A12. Simple, content-first pages

| | |
|---|---|
| **German.net** | Breadcrumbs, one column of content, few decorations, compact cards with counts. Dropdowns for multiple choice to keep sheets short. |
| **LGA** | **Yes**, same spirit (tokens in `globals.css`, one primary action, sticky action bar on phones, 44 px targets, umlaut buttons, `aria-live` results, ✓/✗ text not colour-only). |
| **LGA should** | Keep LGA's design system. Do not adopt dropdown multiple choice: LGA's full-width option buttons are better on phones. Reuse `buttonClass` in any new pages instead of hand-rolled classes. |

### Patterns deliberately not adopted

- **Freemium gating** (free sheet 1, premium sheets 2–28; level locks). LGA content is open, guests included.
- **PDF worksheet downloads.** Not a learner need for an online Goethe course.
- **Huge sheets** (20+ questions). LGA caps exercises at 30 items and its A1 exercises are short; keep them short.
- **Frequency-ranked word lists** across all levels. LGA's words are tied to the curriculum and Goethe A1 topics; a frequency list would be a second, disconnected word system.
- **Vocabulary-level percentages on texts** ("A1 92%, A2 7%"). Needs a full lemmatiser and B-level lists; not worth it at A1.

---

## B. LGA strengths to keep

German.net is a general practice site. LGA is a structured course to Goethe A1. None of the following may be weakened by this work.

| Strength | Where | Why it matters |
|---|---|---|
| **Goethe alignment** | Exam parts derived from `refs`, Goethe Prep with format per Teil, coverage notes (what LGA does *not* practise), one suggestion with a reason, practice exam with server deadline and per-section links back to practice | German.net has nothing exam-specific. This is LGA's purpose. |
| **Structured CEFR curriculum** | 12 modules, 65 lessons mapped to the A1 can-do statements and textbook chapters | Learners always have a next lesson; German.net leaves sequencing to the learner. |
| **Lesson flow** | intro → words → grammar → practice → skills, one step at a time, steps saved | Learn → practise → apply is already built in. |
| **Precise, honest metrics** | `LEARNER.md` "Metrics": latest attempt, unattempted never weak, number of exercises shown, no "readiness" claims | Weak-area features must reuse these rules, not invent new numbers. |
| **Deterministic plan** | `todayPlan`: next lesson, words due, up to two mistakes, least-practised Goethe part, practice exam | Already answers "what should I do now?". Extend, do not replace. |
| **Spaced repetition** | Leitner boxes 1–5, guest and signed-in | German.net shows no review schedule. |
| **Skills German.net lacks** | Listening with play limits and transcripts, speaking with recording and model answers, writing/form filling | Goethe has four parts; German.net covers mostly reading and grammar. |
| **Guest learning with one engine** | Same grading for guests, state in the browser, identical numbers (`tests/integration/guest-learning.test.js`) | Every new view must be a pure function of `(structure, state)` so it works for both. |
| **CMS with lifecycle** | draft → reviewed → approved → published, versioning, readiness report, preview as learner | New metadata goes through the same editors and rules. |
| **Audio architecture** | Recorded audio first, then pre-generated TTS, never TTS at request time | Any new audio use (e.g. typed vocabulary) reuses `audioService`. |
| **Server-side grading, no answer leaks** | `toClient` strips keys, reveal after submit | Hints and new modes must not ship answers to the browser before checking. |

---

## C. Recommendations

Principle: **one curriculum, more doors into it.** Every recommendation reuses the existing content, exercise engine, grading, attempts, progress state and journey views. Exercises are always practised as their lesson step (the existing write path requires `lessonId` and checks the exercise belongs to it), reached with a `from=` return link like Goethe Prep.

### P0: essential learner experience improvements

**P0-1. Practice area: grammar topics and word topics.**
- New route `/practice/<level>` with two lists, built from `getLevelStructure` (no new collection):
  - **Grammar:** the level's 50 grammar topics grouped by module, each with "N exercises · M practised · % right".
  - **Words by topic:** the 68 topic slugs with word counts and "N due", each opening a flashcard deck of that topic.
- `/practice/<level>/grammar/<slug>`: the topic's explanation (reuse `GrammarTopic`), then its exercises in course order with status (not practised / practise again / all right), each linking to `/learn/…?block=<key>&from=grammar-<slug>`.
- Navigation becomes Learn · **Practice** · Review · Goethe Prep · Account (5 tabs on the phone bar; check fit at 360 px).
- *Learner gain:* "What can I practise?" and "where is the accusative?" are answered without remembering which lesson taught it.
- *Goethe:* topic pages list the Goethe part each exercise prepares (data already on the exercise).

**P0-2. Weak areas per grammar topic.**
- `exercise → grammar topics` resolved in `getLevelStructure`: an optional exercise field (see Data) if set, otherwise the grammar blocks of the exercise's own lesson. Module-review lessons have no grammar block, so their exercises count for no topic until an author sets the field.
- New pure view `grammarTopicSkills(structure, state)` in `lib/learning/journey.js`, same rules as `levelSkills`/`weakSkills`: latest attempt per exercise, % right on attempted exercises only, threshold = the level's grammar target (75%), always shown with the number of exercises. Works for guests unchanged (state already holds the latest score per exercise).
- Shown in: Review ("Needs practice: Akkusativ – 2 of 5 points in 1 exercise"), the lesson result, the dashboard Review card, the topic page.
- `todayPlan` rule 3 ("up to two mistakes") prefers mistakes from the weakest grammar topic, then skill, then score. No new rule types.
- *Learner gain:* instead of "Grammar: needs work", the learner sees which grammar and goes straight to it.

**P0-3. Feedback that always explains.**
- After checking, a wrong item with no authored `explanation` shows the linked grammar topic's `summary` as "Rule: …" with a link to the topic. Explanations stay server-revealed (`revealExercise`), so nothing leaks before checking.
- When an exercise is opened with `from=review` or `from=grammar-*`, a collapsed "Rule" panel above it.
- Authoring: `content:check` and the readiness report list items without an explanation (a warning, not an error); the CMS exercise list gets an "Explanations n/m" column.
- *Learner gain:* every mistake comes with a reason. *Content risk:* the fallback is only as good as the topic summary; P0 does not write new explanations (that is Phase D).

**P0-4. Try again keeps what was right.**
- Client-only change in `ExercisePlayer`: on "Try again", correct items stay filled, locked and marked ✓; wrong items are cleared and focused first. The full answer set is submitted and graded as today.
- Attempts, best/latest score, pass threshold and mastery rules unchanged. Exams are untouched (they have no retry).
- *Learner gain:* the second attempt targets the mistakes only.

**P0-5. Flashcards in both directions.**
- A direction switch on `Flashcards`: German → English (today) and English → German (show meaning and image; reveal article + word + plural + audio).
- Same self-rating and Leitner box per word; direction is a display choice and is remembered per learner (browser storage is enough: it is a convenience, not learner progress).
- *Learner gain:* active recall of the German word with its article, which Goethe Schreiben and Sprechen need.

### P1: important improvements

**P1-1. Optional hints.** `hints: localizedText[] (≤2)` on the item base, edited in the exercise editor. Shown one at a time before checking ("Show a hint"). Hints are sent with the item, so authors must write hints that point at the rule, not the answer (CMS help text plus a `content:check` warning when a hint contains an accepted answer). Hint use is not scored in P1; recording it in the attempt is optional.

**P1-2. Typed word practice.** In a topic deck: type the German word (with article for nouns). Checked in the browser against the card that is revealed anyway (self-practice, never a score); umlaut buttons and the `text_input` normalisation rules reused from `lib/exercises/types/textInput.js`; result feeds the same Leitner update as "I knew it / Not yet".

**P1-3. Reading list.** In the Practice area: every published exercise with a text, grouped by module, filter by text kind, with the matching Goethe Lesen Teil (email/message → Teil 1, ad → Teil 2, sign → Teil 3). Opens the lesson step with `from=reading`.

**P1-4. Visible progression on topic pages.** Label exercises by block type (Practice → Test → Check) and order recognition before production within a topic (mcq / true_false / match before text_input / order). Deterministic, no difficulty field.

**P1-5. Verb forms on words.** Optional `verbForms` on vocabulary with `pos: "verb"`: Präsens for six persons, Perfekt (auxiliary + Partizip II), separable prefix. Shown on the word card and on the grammar topic pages for Präsens, modal and separable verbs, Perfekt. CMS editor fields and CSV import columns. Filled by authors for the 86 A1 verbs (Phase D, reviewed).

**P1-6. Lesson result by skill and topic.** Add a short "What this lesson trained" summary above the per-exercise list: per skill and per grammar topic, % right, using the P0-2 views. Keeps the per-exercise list.

**P1-7. Dashboard tweaks (no new section count).** Review card names the weakest grammar topic; a single "Practise" link to the Practice area; "Words from your last lesson" (the last completed lesson's vocabulary step, derived from state, no new data).

**P1-8. Grammar section kinds.** Optional `kind: "rule" | "mistake"` on grammar sections so "Common mistake" and "Key rule" are styled consistently. Existing sections stay untyped.

### P2: optional (not to be implemented without a separate decision)

- **Per-question instant check** for practice blocks only (never tests, mastery checks or exams). Needs per-item grading calls or a different reveal model.
- **Quick practice / mixed sessions** (5–10 items from weak topics across exercises). Needs a grading and progress path that does not belong to one lesson; would change how attempts are stored.
- **Conjugation drill** built on `verbForms` (P1-5).
- **Word help in reading texts** (tap a word to see the vocabulary entry).
- **Longer graded A1 texts** with comprehension questions (content, Phase D).
- Streaks, dark mode (already a Phase 7 item), keyboard shortcuts 1–6 for options.

---

## Data and schema changes proposed

All optional, additive, validated by Zod, edited through the existing CMS editors and payload mappers. No new collection, no migration, no change to attempts or progress documents.

| Field | Where | Phase | Notes |
|---|---|---|---|
| `grammarIds: objectId[] (≤5)` | `exerciseSchema` | P0-2 | Override for the derived lesson link. Needs `assertRelations` (must be grammar topics of the same level) and a `ContentPicker` in `ExerciseEditor`. |
| `hints: localizedText[] (≤2)` | `itemBase` (`lib/exercises/types/common.js`) | P1-1 | Must be added to `clientBase`/`toClient` deliberately. |
| `verbForms` | `vocabularySchema` | P1-5 | Only allowed when `pos === "verb"`. CSV import columns optional. |
| `sections[].kind` | `grammarTopicSchema` | P1-8 | `rule \| mistake`, default none. |

Read-side additions (no stored data): `topics` in `vocabCard`; `grammar` per exercise in `getLevelStructure`.

**Lifecycle consequence.** Setting any of these fields is a content edit: the item's version increases and it goes back to draft (`ARCHITECTURE.md`, content lifecycle). That is why P0-2 derives the grammar link from lessons instead of requiring authors to set it on 272 exercises.

## Affected files (expected)

| Area | Files |
|---|---|
| Structure and views | `lib/services/journeyService.js` (`getLevelStructure`), `lib/learning/journey.js` (new topic views, `todayPlan` ordering, `reviewView`), `lib/services/curriculumService.js` (`vocabCard` topics) |
| Exercise UI | `components/exercises/ExercisePlayer.js` (retry, rule fallback, hints), `components/exercises/items/*` (locked state) |
| Words | `components/learn/Flashcards.js` (direction, typed mode), `lib/services/learningService.js` (cards by topic, guest variant) |
| New learner pages | `app/(learn)/practice/[level]/page.js`, `…/grammar/[slug]/page.js`, `…/words/[topic]/page.js`, `…/reading/page.js`; components in `components/journey/` and `GuestJourney.js` for guests |
| Navigation and return links | `components/layout/LearnerNav.js`, `proxy.js` (no change expected: practice pages are open), lesson page `from=` handling (generalise `goethe-<part>`) |
| Dashboard, review, result | `components/journey/HomeView.js`, `ReviewView.js`, `components/learn/LessonResult.js` |
| CMS (P1) | `lib/validation/content.js`, `components/admin/editor/payload.js`, `ExerciseEditor.js`, `simpleEditors.js`, `lib/content/vocabularyImport.js`, `lib/services/contentService.js` (`assertRelations`), `lib/services/readinessService.js` and `scripts/content-check.mjs` (explanation coverage) |
| Docs | `LEARNER.md` (new metrics and routes), `CMS.md`, `ARCHITECTURE.md` |
| Tests | `tests/unit/journey.test.js`, `exercises.test.js`, `cms-payload.test.js`; `tests/integration/guest-learning.test.js` (guest = signed-in numbers for topic views); new `tests/e2e/practice.spec.js` (desktop + Pixel 7) |

## Affected learner flows

| Flow | Change |
|---|---|
| Dashboard | Review card names a grammar topic; Practice link; plan prefers weak-topic mistakes |
| Lesson | Exercise retry keeps correct answers; rule fallback on wrong items; result summary by topic (P1) |
| Review | Weak grammar topics; rule panel on the exercise; return link |
| Practice (new) | Grammar topics, word topics, reading list; always into the existing lesson step and back |
| Goethe Prep, exams | Unchanged. Topic and reading pages link to Goethe parts; nothing in exams changes |
| Guest | Same views run in the browser; no new state fields except the flashcard direction preference |

## Risk assessment

| Risk | Level | Mitigation |
|---|---|---|
| **Content not live.** All A1 content is `ai_generated` and draft until humans approve it. A Practice area over unpublished content is empty. | High (for impact) | Build and test against fixture-published dev data (`content:fixture-publish`); the pages must have clear empty states. |
| **Thin explanations** (9% of items). P0-3's fallback depends on grammar summaries being good. | Medium | Coverage report first; explanations are Phase D content work, reviewed. |
| **Derived grammar links can be wrong** (a lesson with two grammar topics attributes each exercise to both; review lessons attribute to none). | Medium | Show the number of exercises behind every topic number; allow the explicit `grammarIds` override; readiness report lists exercises with no topic. |
| **Seeding overwrites CMS edits.** `bun run seed -- --update` replaces changed documents and nulls fields the seed lacks, so CMS-only `hints`, `grammarIds` or `verbForms` would be wiped. | High | Never use `--update` on databases with CMS edits; if seed files gain these fields, add them to the seed first. Document in `CMS.md`. Default `seed` (insert-missing) is safe. |
| **Lifecycle resets.** Adding metadata to approved content sends it back to draft and unpublishes it. | Medium | P0 needs no content edits. P1 fields are added during review, before approval, not to live items. |
| **Answer leaks through hints.** | Low | Authoring check (hint must not contain an accepted answer); hints are optional. |
| **Mobile navigation with five tabs.** | Low | Check at 360 px in the Pixel 7 project; fall back to Practice as a dashboard entry if it does not fit. |
| **Metric drift** (new topic numbers disagreeing with skill numbers). | Medium | Topic views reuse the skill calculation functions; define them in `LEARNER.md` "Metrics" before building; guest/signed-in equality test. |
| **Regression in grading or progress.** | Low | P0 changes no server grading, attempt or progress write; retry is client-only. Existing suites cover the rest. |
| **Copying german.net.** | Low | No text, exercise or layout is reused; topic names come from LGA's own grammar topics and word topics. |

## Proposed order after approval

1. **Phase B (docs only):** the Practice area navigation, topic pages, topic metric definitions (added to `LEARNER.md`), retry and feedback behaviour, flashcard directions.
2. **Phase C:** P0-1 to P0-5, each with tests; then P1 items in the order 1, 6, 3, 2, 7, 4, 8, 5.
3. **Phase D:** explanations and hints for the most-missed items, verb forms for A1 verbs, more A1 texts; all reviewed through the CMS.
4. **Phase E:** Goethe links on topic and reading pages, Goethe-part suggestions that use weak topics.

---

## Phase B: decisions that differ from the recommendations above

Approved P0 scope: practice discovery, grammar-topic weak areas, the wrong-answer fallback, Try again keeping right answers, and two-way flashcards. Where the implementation differs:

| Recommendation | Implemented | Why |
|---|---|---|
| P0-1: a fifth "Practice" tab | **No tab.** Practice is reached from the learner home (Practice card), Review, the lesson result and topic links. `/practice` counts as "Learn" in the navigation | Product decision; adding the tab later is one entry in `LEARNER_NAV` |
| P0-1: a reading list | Not in Phase B (it is P1-3) | Scope |
| P0-2: optional `grammarIds` override on exercises | **Not added.** The link is derived only: a grammar-**skill** exercise in a lesson with **exactly one** grammar step | No schema change and no content edits (edits send approved content back to draft). Lessons with two topics (3 in A1) and module tests count for no topic; the report lists them |
| P0-2: `todayPlan` ranks mistakes by weak topic | **Unchanged.** Weak topics show in their own Practice card on the home page | Keeps the documented plan rules stable |
| P0-3: a "Rule" panel above exercises opened from Review | Not built. The rule shows **after** checking, on wrong items without an explanation | Smallest change that answers "why?"; avoids extra reading before practice |
| P0-3: an "Explanations n/m" column in the CMS exercise list | A separate read-only report (`/admin/explanations`, `content:check -- --explanations`) | No change to the CMS lists; one report with lesson, module, type and fallback per exercise |
| P0-5: the direction remembered per learner | Per browser (`localStorage`), for guests and signed-in learners alike | A display preference, not learner state; no new stored field |
| Word topic labels | UI labels in `lib/content/vocabTopics.js` (68 A1 slugs) with a readable fallback | The content has topic slugs only |
