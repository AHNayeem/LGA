# Learner experience

Status: implemented 2026-09-30; QA, exam drafts and Goethe Prep depth added 2026-10-01. How a learner moves through LGA, how guests learn without an account, where learner state lives, and exactly how every learner-facing number is calculated. When you change a calculation, change it here too.

## The learning loop

```
/ (home) ── Start learning ──► /start (goal, starting point; optional, no account)
                                   │
                                   ▼
/dashboard  "What should I do now?"  one primary action: Continue/Start: Modul X · Lesson
   │   Today's plan · Your A1 (lessons, skills) · Review · Goethe Prep · modules
   ▼
/learn/a1/<module>/<lesson>?block=…   intro → words → grammar → exercises (checked by the server)
   │
   ▼
?view=result   lesson result: points, what to practise again, Next lesson / Finish the module
   │
   ▼
/learn/a1/<module>   when every lesson is done: "Module complete!" → Next module / practise mistakes
   │
/review   words due + exercises to practise again (grouped by lesson, with its grammar) → back into the exercise
   │
/goethe/a1   exam parts (Hören, Lesen, Schreiben, Sprechen) → /goethe/a1/<part> → exercise (?from=goethe-<part>) → back to the part
   │
/exams/a1/<exam>   practice exam → result per section → "Practise this part" → /goethe/a1/<part>
```

Every screen ends with a next step; there is no dead end. Navigation: **Learn · Review · Goethe Prep · Account** in the header on tablets and desktops, and as a bottom tab bar on phones. The tab bar is hidden inside a lesson and a running exam (focus mode), where those pages have their own sticky action bar.

## Guests and signed-in learners

One learning system: the same pages, content, grading and calculations. The only difference is where the learner state is kept.

| | Guest (no account) | Signed in |
|---|---|---|
| Published content, audio, images | ✓ | ✓ |
| Grading | on the server, same `gradeExercise` / `gradeExam`, **nothing stored** | on the server, stored (`attempts`, `userProgress`, `examAttempts`) |
| Lesson steps, exercise results, word reviews, exam results, goal | this browser: `localStorage["lga:guest:v1"]` | MongoDB |
| Survives reload / reopening the browser | same device and browser only | everywhere |
| Speaking | record and listen in the browser, never uploaded | uploaded, private to the learner |
| Practice exam | graded, result shown and kept in the browser; answers and start time kept in the browser (`lib/exams/draft.js`) | stored attempt with server deadline and history; answers kept in the browser until submitted |
| Stored exam attempts (`/exams/attempts/*`), recordings | – | ✓ |

- **Nothing a guest's browser keeps is ever sent to the server** or used for any server decision. Scores in it come from the server's grading, but the server neither reads nor trusts them.
- Guests write exactly one thing on the server: the per-IP rate-limit counter (`GUEST_RATE_LIMITS.learningByIp`, 600 requests/hour, `lib/security/guestRateLimit.js`). It covers guest grading of exercises and exams and loading review flashcards.
- The only pages that need an account are `/admin` and `/exams/attempts/*` (`proxy.js`). All writes of learner data still require a session (`assertLearner`).
- **Non-blocking invitation:** guests see "Create a free account to keep your progress" at the lesson result, the exam result, the module page and the home page (`SaveProgressNudge`). Registration and sign-in return to the page the learner came from (`?next=`).
- **Guest progress is not moved into a new account** (decision 2026-09-30). `/account` says so and lets a guest clear their browser progress.

## Learner state

Content and learner state are kept apart:

```
Content (published)         ──► learning activity ──► learner state
  getLevelStructure(level)        lesson, review,        signed in: MongoDB (userProgress, userVocabulary, examAttempts, users.learningProfile)
                                  exam                   guest:     browser (lib/learning/guestStore.js)
```

One shape for both (`lib/learning/state.js`):

```
{ version: 1,
  lessons: { [lessonId]: { blocksDone: [key], completedAt,
             exercises: { [exerciseId]: { skill, attempts, bestRatio, passedAt, last: { score, maxScore, ratio, passed, at } } } } },
  vocab:   { [vocabId]: { box, dueAt, reps, lapses, lastResult, lastReviewedAt } },
  exams:   { [examId]: [ { at, score, maxScore, ratio, passed, passThreshold, sections: [{ key, title, score, maxScore, ratio }] } ] },   newest first, ≤ 10
  profile: { goal, levelCode, startModule } | null }
```

- The lesson entry has the `userProgress` document's shape, so `lib/learning/progress.js` works on both.
- The guest reducers (`applyExerciseResult`, `applyBlockDone`, `applyVocabReview`, `applyExamResult`) follow the same rules as the progress repository's atomic updates and `srs.reviewCard`.
- Stored guest state is validated when read (`normalizeLearnerState`), field by field: counts, ratios (0–1), dates, Leitner boxes (1–5), exam sections and the profile's goal, level and module slug. Anything malformed, or of another version, is dropped, never repaired, and sizes are capped (2,000 lessons, 60 exercises per lesson, 10,000 words, 10 results per exam). A corrupted entry therefore costs that entry, never the page (`tests/unit/journey.test.js` runs every view on corrupted states; `tests/e2e/journeys.spec.js` loads the pages with them).
- There is no expiry for guest state: it stays until the guest clears it (`/account`) or the browser's site data.
- **Adding a streak later:** derive active days from the timestamps already in the state (`last.at`, `lastReviewedAt`, exam `at`) or add an `activity` entry to the state and a small collection. No page needs a new data path.

### One engine, two stores

`lib/services/journeyService.js`:
- `getLevelStructure(code)`: the level's published content, reduced to what the views need. Modules, available lessons with their blocks and grammar titles, per exercise `{ skill, maxScore, passThreshold, goethe }`, Goethe parts and practice exams. It holds no learner data.
- `loadLearnerState(actor, structure)`: a signed-in learner's stored state.

The views in `lib/learning/journey.js` are pure functions of `(structure, state)`:
- `homeView`, `levelView`, `moduleView`, `reviewView`, `goetheView`, `goetheSectionView`
- `lessonViewWithState`

For signed-in learners the server runs them. For guests the page sends the structure, and `components/journey/GuestJourney.js` (and `GuestLesson.js` for lessons) runs the same functions in the browser on the guest's state. Until the browser state has been read, a "Loading…" placeholder shows, never a made-up number. `curriculumService.getLearnerModule` / `getLearnerLevel` use the same `summarizeModule`. `tests/integration/guest-learning.test.js` checks that a guest and a signed-in learner with the same answers get identical numbers.

## Metrics: definitions

Every number shown to learners is one of these. They are the same on every page (home, level, module, lesson result, review, Goethe Prep).

| Metric | Definition | Where |
|---|---|---|
| **Step done** | intro or grammar: read ("Continue"). Words: every card rated. Exercise: an attempt reached the exercise's pass mark (default 60%). Speaking: every prompt answered | `isBlockDone` |
| **Lesson completed** | every step done; the first completion time is kept | `lessonCompletion` |
| **Module progress %** | steps done ÷ all steps of its lessons | `moduleCompletion` |
| **Lessons completed (level)** | completed lessons ÷ available lessons of the level | `levelOverview.lessons` |
| **Module complete** | every lesson of the module completed | `moduleView.complete` |
| **Level complete** | every available lesson of the level completed (modules with no published lesson yet don't hold it back); the module page uses the same rule | `levelOverview.complete`, `moduleView.levelComplete` |
| **Skill: % right** | on the exercises of that skill the learner has attempted: sum of the latest scores ÷ their points. No attempt → "Not started yet" | `levelSkills` → `breakdown[skill].performance` |
| **Skill: progress towards the target (bar)** | latest score of every graded exercise of that skill in the level ÷ all its points, **unattempted exercises count as 0**, compared with the LGA target (level mastery rules: vocabulary 80%, grammar 75%, reading and listening 70%, writing 60%). "Target reached" when met. Module pages use the same rule with the module's rules | `scopeMastery` |
| **Weak skill** ("Below the LGA target so far") | a skill whose **% right** is below its target. Exercises not done yet never make a skill weak. Always shown with the number of exercises it rests on ("in the one exercise you did"), so a single attempt isn't presented as a settled weakness | `weakSkills` |
| **Speaking** | never scored (no pronunciation assessment). Shown as "N of M practised · self-rated" | `levelSkills.ungraded` |
| **Mistake** ("Practise again") | a graded exercise whose **latest** attempt scored below 100%. Gone once it is fully right. Links to the exercise step | `mistakes` |
| **Words due** | words from the level's lessons whose review time has come (Leitner boxes 1–5: 10 min, 1, 3, 7, 21 days). Self-rated, never part of any score | `dueVocabulary` |
| **Lesson result points** | sum of the latest attempt's points of each exercise in the lesson | `LessonResult` |
| **Goethe part: practised** | exercises linked to that exam part with at least one attempt ÷ all linked exercises | `goethePrep` |
| **Goethe part: % of points** | latest scores ÷ points, on the practised graded exercises only | `goethePrep.ratio` |
| **Goethe part: fully right / to practise again** | linked graded exercises whose latest attempt scored 100% / below 100% | `goethePrep.perfect`, `toImprove` |
| **Goethe part: suggested next** | one exercise, by fixed rules (see Goethe Prep), always shown with its reason | `goethePrep.next` |
| **Practice exam result** | server-graded total and per section, against the exam's **LGA practice target** (its pass mark, default 60%). A section below that share is marked and links to its Goethe part | `examResults` |

Wording rule: LGA never says "official", "passed the Goethe", "readiness" or "chance to pass". Scores are "your practice performance" against the "LGA practice target". The Goethe pages and the exam overview carry the not-official disclaimer.

## Today's plan

Deterministic rules, no AI (`todayPlan`):
1. **The next lesson.** The first unfinished lesson from the learner's starting module on; earlier modules come once everything after it is done. It shows the lesson's own time estimate.
2. **Words due**, if any.
3. **Up to two mistakes**, from the weakest skills first, then the lowest scores.
4. **The least-practised Goethe part**, for learners whose goal is "Prepare for the Goethe exam" or "Practise specific skills".
5. **The practice exam**, once every lesson is done.

Only lessons have a real time estimate (`estimatedMinutes`), so only lessons show minutes. No duration is invented for review or practice items.

## Onboarding

`/start`, two questions:
1. **Goal:** learn from zero, improve, prepare for Goethe, or practise specific skills.
2. **Starting point:** "I'm new" (Module 1) or "I know some German" (the learner picks a module).

There is **no placement test**: the curriculum has no reliable diagnostic, and there is one level.
- Guests keep the answers in the browser. Signed-in learners store them on `users.learningProfile`, via `saveLearningProfileAction` → `learningProfileService`, which checks that the level and module are published.
- Goethe and skills goals go to Goethe Prep after onboarding; the others go to the home page.
- The goal changes today's plan (rule 4). The starting module changes "Continue".
- Onboarding is optional: the home page links to it, and "Skip" starts with the first lesson.

## Goethe Prep

- **Exam parts.** An exercise prepares an exam part when its `refs` point to a child of an exam specification reference: `goethe-start-deutsch-1-hoeren` → part `hoeren` (`curriculumService.goetheParts`). No content is duplicated: the practice items are the lesson exercises, and each one links to its lesson step.
- **Exam part page** (`/goethe/<level>/<part>`), top to bottom:
  - **In the exam:** what each Teil asks, from the published exam format (`REFERENCE-ANALYSIS.md` §1). Stored as reference metadata (`meta.teil1`…, `content/seed/references.js`); informational only. Databases seeded earlier get it with `bun run seed -- --update-references`, which refreshes reference metadata only and needs no review.
  - **What LGA practises**, and in a warning box what it doesn't (`GOETHE_PART_COVERAGE`, `lib/learning/goethe.js`): Schreiben Teil 2 (free writing) is not practised or scored; Sprechen is self-rated with no partner or examiner. The overview marks these parts "LGA covers only part of it". A part is never presented as fully practised when LGA can't practise all of it.
  - The evidence: exercises and lessons that prepare the part, how many were practised, fully right and to practise again, the share of points, and the part's result in the latest practice exam ("below the LGA practice target" when it was).
  - **One suggestion with its reason** (`goethePrep.next`), first rule that applies: the first exercise in course order whose latest attempt wasn't fully right ("Your last attempt got 2 of 5 points."); else the first one not practised yet in a lesson the learner has started; else the first one not practised yet in course order. No model, no prediction; the reason says only what the data says.
  - Every exercise by module, with its status: not practised, practised, practise again, passed, all right.
- **The way back.** Exercise links from Goethe Prep carry `?from=goethe-<part>`. The lesson then shows "← Back to Hören practice" above the step and next to the exercise's result. Only the four part keys are accepted; the parameter changes nothing else.
- **Practice exams** use the exam engine unchanged (`EXAMS.md`):
  - signed-in learners: stored attempts
  - guests: `getGuestExamPaper` / `gradeExamAsGuest`: the same snapshot and grading, the exam's own review policy, and a fixed shuffle seed per exam version. A paper from an older version is rejected, and nothing is stored.
  - Results link each section to the practice of the same Goethe part.

## Routes

| Route | Who | What |
|---|---|---|
| `/` | everyone | what LGA is, Start learning |
| `/start` | everyone | onboarding |
| `/dashboard` | everyone | learner home ("Learn") |
| `/learn/<level>`, `/<module>`, `/<lesson>?block=…`, `?view=result` | everyone | level, module, lesson and lesson result |
| `/review` | everyone | words due and mistakes |
| `/goethe` → `/goethe/<level>`, `/goethe/<level>/<part>` | everyone | Goethe Prep |
| `/exams/<level>/<exam>` (`?take=1` for guests) | everyone | practice exam overview; guests take it in the browser |
| `/exams/attempts/<id>` | signed in | stored attempt and result |
| `/account` | everyone | guest mode explained, or account and goal |

## Server entry points

| Function | File |
|---|---|
| Structure, learner state, practice links | `lib/services/journeyService.js` |
| Guest grading of exercises, guest review cards | `learningService.gradeExerciseAsGuest`, `getVocabularyCardsAsGuest` |
| Guest exam paper and grading | `examService.getGuestExamPaper`, `gradeExamAsGuest` |
| Guest actions (IP from `getRequestContext`) | `app/actions/guest.js` |
| Learning profile | `learningProfileService.saveLearningProfile`, `saveLearningProfileAction` |
| Media for guests | `mediaService.canReadMedia(null, asset)`: curriculum TTS, and uploads only while approved, published content attaches them. **Private recordings: owner or `media:manage` only**; missing and forbidden are both 404 |

**When a session ends** while a page is open, the next save fails with `UNAUTHENTICATED`. Learner actions show it through `components/learn/ActionError.js`: "Your session has ended, so this wasn't saved. Sign in again", which returns to the same page (`/login?next=`). An exam's answers stay in the browser meanwhile.

**Loading:** `app/(learn)/loading.js` shows the page's rough shape while a learner page renders on the server; guest pages then show "Loading…" until the browser state is read.

Player components take `mode: "user" | "guest" | "preview"` (`ExercisePlayer`, `ContinueButton`, `LessonView`; `Flashcards` uses `learner`). `ExamPlayer` takes `guest`. In "guest" mode results go into the browser state, and nothing is uploaded.

## Tests

| File | Covers |
|---|---|
| `tests/unit/journey.test.js` | guest reducers mirror the server rules; malformed state is dropped; metrics for a new learner (no invented numbers); latest-attempt skills; "weak" only from attempted exercises; mistakes appear and resolve; starting module; plan rules and minutes; Goethe parts; exam section links; module completion and the next module; lesson overlay |
| `tests/integration/guest-learning.test.js` | guests read published content only (drafts 404), with no state and no answer keys; writes need an account; guest grading scores correctly, ignores forged fields and checks the exercise belongs to the lesson; **full-database snapshot before and after a guest lesson and review: identical except the rate-limit counter, no attempts/progress/vocabulary/exam documents**; per-IP rate limit; **guest and signed-in numbers identical for the same answers**; guest practice exam graded without an attempt, review policy applied, stale versions and unpublished exams rejected; private recordings closed to guests and other learners |
| `tests/e2e/guest.spec.js` (desktop + Pixel 7) | home → start → onboarding → home → lesson with mistakes → result → reload keeps it → next lesson → failed exercise → review → practise again → same state in a new tab → Goethe Prep → part → practice exam → section practice link → local exam history → a new account starts clean. Signed in: lesson → refresh → sign out (guest home shows nothing) → sign in → progress, review, Goethe |
| `tests/unit/continuation.test.js` | "Continue" and "next module" from the first to the last lesson, gaps from unpublished lessons and modules, completed lessons never offered again, a lesson that can't be completed reported as a loop |
| `tests/unit/exam-draft.test.js` | exam drafts: only the paper's own answers kept, malformed or old drafts dropped, guest expiry after the deadline plus the server's grace, scoping per attempt / exam version, pruning, blocked storage |
| `tests/e2e/journeys.spec.js` (desktop + Pixel 7) | guest mistake → Review → exercise → retry → mistake gone; guest practice exam survives a reload and a closed browser ("Continue your practice exam", clock keeps running), an expired attempt isn't scored; full exam → result → part practice → format, coverage, reason → exercise → back to the part; corrupted guest storage on every page; a session that ends mid-lesson → sign in → back at the lesson; a slow server shows the pending state and takes one submission |
| `tests/e2e/learner.spec.js`, `auth.spec.js`, `speaking.spec.js` | updated: the lesson result step; open learning pages; anonymous media is 404 for unknown and private ids |

## Known limitations

- Guest progress lives in one browser; clearing site data or private windows lose it. It is not moved into a new account.
- A guest's rate limit is per IP: guests behind one shared IP share the window.
- Guest practice exams use a fixed shuffle seed per exam version. That's harmless, because a guest's score is never stored.
- The level structure covers only lessons that are fully available (everything they use is published). It reads every page of lessons (there used to be a cap of 100 per level) and every word they use (lookups used to stop at 500 documents, fewer than A1's 622 words).
- Goethe progress is per exam part (Hören, Lesen, Schreiben, Sprechen), not per Teil: exercises are linked to parts only.
- A guest's practice exam can be submitted at any time: there is no server deadline for guests (nothing is stored). An attempt whose time ran out while the guest was away is discarded, not scored.
- Readiness for the real exam is not estimated. There are no official thresholds, and LGA shows practice performance only.
- No activity streak yet; see "Adding a streak later" above.
