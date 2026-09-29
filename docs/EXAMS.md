# Exams

Status: implemented 2026-09-29. A reusable exam engine: admins define exams from exercises in the library, learners take them in timed or untimed attempts, and the server grades, stores and reviews every attempt. The first seeded exam is **A1 Probeprüfung 1**, an original practice exam in the Goethe-Zertifikat A1 format (Hören, Lesen, Schreiben Teil 1).

## What it builds on
No second question model, grading engine or learner flow was added.

| Existing piece | How exams use it |
|---|---|
| `exercises` collection and item types | Exam questions are the items of ordinary exercises. Only automatically scored types can be used (`mcq`, `true_false`, `text_input`, `match`, `order`) |
| `gradeExercise`, `toClientExercise`, `revealExercise` (`lib/exercises/engine.js`) | Grade, build the learner payload and the review. Extended with one optional `seedPrefix` (see *Shuffling*); without it the behaviour is byte-for-byte unchanged |
| Content lifecycle (`draft → reviewed → approved`, `published`), versions, `saveContent` | `exams` is a lifecycle-managed content collection like `lessons` |
| Item renderers, `AudioPlayer`, stimulus rendering | The exam player and result reuse them |
| `createExerciseAudioResolver`, `createImageResolver`, `/api/media/:id` | Audio (recording → TTS) and images, with the existing access rules |
| `assertCanPreview` (`content:read-drafts`), `requireAdminPage` | The CMS preview |
| `learningByUser` rate limit | Start and submit |

## Model

### `exams` (content, lifecycle-managed)
```
{ levelCode, slug, order, title, description?, instructions?,
  durationMinutes: 1–240 | null (untimed),
  passThreshold: 0–1 (share of all points; default 0.6),
  reviewPolicy: "summary" | "marks" | "full",
  sections: [{ key, title, instructions?, exerciseIds: [ObjectId] }],   ≤ 8 sections, ≤ 20 exercises each, ≤ 40 in total
  tags, refs, provenance + lifecycle fields }
```
- An exercise may appear only once per exam, and section keys are unique (schema rules).
- Sections may be empty while authoring. **Publishing** (`assertPublishable`) requires at least one exercise, no empty section, every exercise to exist and be published, and every question to be scored automatically (`examReadiness` in `lib/exams/exam.js`). The admin page shows the same checks.
- Writes need `content:write` **and** `exam:configure` (the permission existed since Phase 1). Review and publishing use the normal `content:review` / `content:publish`.

### `examAttempts` (per learner)
```
{ userId, examId, examVersion, levelCode,
  status: "in_progress" | "submitted" | "expired",
  seed,                 secret shuffle seed (16 random bytes), never sent to the client
  snapshot,             the exam and every exercise body (with id and version) at start
  startedAt, deadlineAt (null when untimed), submittedAt, submitReason ("user" | "timer" | "timeout"),
  answers,              only answers to questions in the exam, stored once, at submission
  result,               { score, maxScore, ratio, passed, passThreshold, questionCount, answeredCount, correctCount,
                          sections: [{ key, title, score, maxScore, ratio, questionCount, answeredCount, correctCount }],
                          exercises: { [exerciseId]: { score, maxScore, items: [{ itemId, answered, correct, score, maxScore }] } } }
  updatedAt }
```
Indexes: unique partial `{ userId, examId }` while `status: "in_progress"` (at most one open attempt per learner and exam), and `{ userId, examId, startedAt: -1 }` (history). Exams: `{ levelCode, slug }` unique, `{ levelCode, publishStatus, order }`, `sections.exerciseIds`. Run `bun run db:indexes`.

**Why a snapshot:** editing an exercise resets it to draft and may change its answer key. The snapshot makes grading and review of an open or finished attempt independent of later edits. Its size is bounded (≤ 40 exercises of ≤ 30 items).

## Flow
```
/learn/a1  →  "Practice exams" (ExamCard)  →  /exams/[level]/[slug]   rules, history, Start
  startExamAction({ examId })
     exam + level + every exercise approved and published, all auto-scored   (else 404)
     open attempt? → resume it (expired open attempts are closed first)
     else insert { snapshot, seed, startedAt, deadlineAt }                     (unique index stops duplicates)
  → /exams/attempts/[id]
     getExamAttempt: owner only; in progress → paper (no keys, no transcripts) + deadline + server clock
     ExamPlayer: one task per screen, Previous/Next, palette, timer, answers in sessionStorage
  submitExamAction({ attemptId, answers, reason })
     owner only; must be in progress; not past deadline + 60 s grace (else closed as expired, 409)
     gradeExam(snapshot, sanitized answers, seed) → conditional update { status: in_progress } → submitted
  → the same page renders ExamResult (per review policy)
```

| Rule | Where |
|---|---|
| Client sends only ids and raw answers; forged `score`/`passed` fields are ignored | `submitSchema`, `sanitizeExamAnswers` |
| Unknown exercises and items are dropped; malformed answers count as unanswered (0 points) | `sanitizeExamAnswers`, `gradeExercise` |
| Another learner's attempt: 404 on read and submit | `findOwnAttempt` scopes by `userId` |
| A submitted or expired attempt can't change; concurrent submissions: exactly one wins | `closeOpenAttempt` filters on `status: "in_progress"` |
| Deadline is the server's; the client timer is corrected by the server clock and auto-submits at 0:00 | `deadlineAt`, `serverNow`, `SUBMIT_GRACE_MS` |
| Late submission (after deadline + 60 s) | Rejected; the attempt is closed as `expired` without a score (product decision, 2026-09-29) |
| Pass/fail | `score ≥ passThreshold × maxScore` on the total auto-scored points (inclusive, float-safe). No per-section minimum |

### Shuffling
Match and order items are shuffled with a seeded permutation. Lessons seed it with `exerciseId:itemId`, which is public, so the authored (correct) order could be reconstructed. In exams the seed is prefixed with the attempt's secret `seed` (`seedPrefix` in the engine), so the order can't be predicted and answers can't be computed offline. The CMS preview uses a fixed `preview:<examId>:<version>` seed (admins only).

### Review policies
| Policy | The learner sees after submitting |
|---|---|
| `summary` | total points, percentage, pass/fail, section scores |
| `marks` | + every question with their own answer and right/wrong. **No correct answers, explanations or transcripts** |
| `full` | + correct answers, explanations and transcripts (subject to each exercise's `transcriptPolicy`) |

The filtering happens on the server (`examResultView`), so hidden answer keys never reach the browser. During the attempt there are never transcripts or explanations, whatever the exercise's own `transcriptPolicy` says.

### Listening
`maxPlays` / `itemAudioMaxPlays` are applied by the audio player as in lessons. They remain a practice rule enforced in the browser, not a security boundary; the exam doesn't rely on them. Audio access follows `canReadMedia`: TTS is readable by signed-in users, recordings only while their exercise is approved and published.

## What is not auto-scored
There is no reliable automated evaluation of speaking or free writing in this project (no pronunciation scoring, no rubric scorer). Therefore:
- `speak_prompt` items can't be part of an exam; publishing is refused.
- Goethe *Sprechen* and *Schreiben Teil 2* are not in the seeded exam. Learners practise them in the modules (speaking prompts, guided writing gap-fills).
- Adding them later needs a separately marked, manually or AI-evaluated section that is excluded from the automatic score. That is deliberately not built.

## Kept apart from learning progress
| | Stored in | Completed by |
|---|---|---|
| Exercise attempt (lessons) | `attempts` | submitting an exercise in a lesson |
| Lesson completion | `userProgress` | every block done |
| Skill mastery | computed from lesson attempts | latest attempt per exercise vs. thresholds |
| **Exam completion** | `examAttempts` | submitting an exam attempt |
| Level completion | not implemented | – |

Exam attempts never write to `attempts`, `userProgress` or `userVocabulary`, never count towards mastery, and never mark a lesson, module or level complete. Exams are not locked behind finishing modules; no such rule was specified.

## CMS
| Route | Content |
|---|---|
| `/admin/exams` | List with search and filters, rules, lifecycle controls, *Preview* |
| `/admin/exams/new`, `/admin/exams/[id]` | `ExamEditor`: level, slug, order, title, description, instructions; timed/untimed and duration; pass mark (%); review policy; sections (add, remove, reorder; key, title, instructions) with exercises picked from the library (`ContentPicker`), reordered and removed. Publish readiness and bulk review (the exam and its exercises, one step at a time) |
| `/admin/exams/[id]/preview` | The learner `ExamPlayer` in preview mode |

Edits follow the normal rules: saving an approved or published exam returns it to draft and hides it; the version is checked. Exercise edit pages list the exams that use the exercise (`usedByExams`).

### Preview
The preview follows the lesson preview principles (CMS Phase 3): `getExamPreview` and `previewExamSubmission` need `content:read-drafts`, load the exam and its exercises in any state, and grade with the same functions. **Nothing is written**: no attempt, no answers, no rate-limit counter, no log line. The timer runs only in the browser. The preview always shows the full review and says which policy learners get. Unpublished or ungraded exercises are listed in the banner.

## Code
| Piece | File |
|---|---|
| Schema | `examSchema` in `lib/validation/content.js`; constants in `lib/content/constants.js` |
| Structure (snapshot, readiness, client paper) | `lib/exams/exam.js` |
| Scoring and review | `lib/exams/scoring.js` |
| Attempts | `lib/repositories/examAttemptRepository.js` |
| Service | `lib/services/examService.js` |
| Content integration (save, relations, publish, admin reads, bulk) | `lib/services/contentService.js` |
| Actions | `app/actions/exams.js` |
| Learner UI | `app/(learn)/exams/**`, `components/exams/*` |
| Admin UI | `app/admin/exams/**`, `components/admin/editor/ExamEditor.js` |
| Seed | `content/exams/**`, `seedExam` in `lib/services/seedService.js`; `bun run seed` seeds exams as drafts |

## Tests
| File | Covers |
|---|---|
| `tests/unit/exams.test.js` | `seedPrefix` (default unchanged, different shuffles, consistent grading), snapshot contents, client paper (numbering, no keys, no transcript), readiness, section sums, inclusive pass mark, wrong seed, sanitising, all three review policies, expired view |
| `tests/unit/exam-content.test.js` | Seeded exam definitions: schema, every question auto-scored, answer keys self-consistent, own slugs, no Bangla, bounded audio |
| `tests/integration/exams.test.js` | Permissions (USER, anonymous) on every CMS entry point; relation checks; publish refused with ungraded/unpublished/empty content; duplicate keys and exercises; bulk review. Visibility (draft, unpublished exercise, admin can't start a draft). Start/resume, no keys in the paper, scoring, unanswered, threshold boundary, forged fields and unknown ids, immutability, concurrent submissions, cross-user access, grace period and expiry, untimed exams, snapshot stability after edits. Review policies. No writes to `attempts`/`userProgress`/`userVocabulary`. Preview: permissions and a full-database snapshot before and after |
| `tests/integration/curriculum-a1.test.js` | The seeded exam publishes with its exercises and appears on the level page |
| `tests/e2e/exams.spec.js` | Real UI: level page → overview → start → palette, Previous/Next, reload keeps answers, unanswered warning, submit → 100% passed with review, history, another learner gets 404. Admin preview grades and creates no attempt; learners are redirected away |

## Known limitations
- **Answers live in the browser until submission.** A reload keeps them (sessionStorage), but another device or a cleared browser starts the open attempt with no answers. The deadline keeps running either way.
- **An open attempt continues from its snapshot** even if the exam is unpublished or edited meanwhile; new attempts can't start until it is available again.
- **One exam attempt at a time per exam**; unlimited attempts overall (no attempt limit was specified).
- **Timer precision:** the grace period (60 s) covers slow networks. A learner whose browser is closed past the deadline gets an expired attempt, not a score.
- **No per-section time limits or minimum scores**, no question pools or randomised question order, no manual marking.
- **The pass mark is the app's practice target**, not an official Goethe criterion; the Goethe PDFs don't document one (REFERENCE-ANALYSIS.md §1).
- **Media access checks the exercise, not the exam** (as for lessons): a recording is playable while its exercise is published.
