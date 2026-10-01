# Changelog

Newest first. Details for each phase are in the linked documents.

## 2026-10-01: Content readiness, learner QA, Goethe Prep depth, production checks
See [CURRICULUM-A1.md](CURRICULUM-A1.md) §2c, [LEARNER.md](LEARNER.md) and [EXAMS.md](EXAMS.md). No content was approved, published or changed; no curriculum text was written.
- **Curriculum readiness report** (`readinessService.checkLevelReadiness`): `bun run content:check -- --all` and `/admin/readiness` (read-only; not in the admin navigation yet).
  - Per lesson: live for learners or not, plus one state: blocked, needs audio, needs review, ready.
  - Checked on the stored content: broken and archived references, duplicate block keys, schema, answer keys, recordings and images, Goethe links (existence, one part, matching skill), lesson and module order, published levels and modules that learners see empty, the "Continue" sequence, and the exams.
  - The open QA findings are machine-readable (`content/curriculum/a1/review-findings.js`) and shown on the lessons and exam they affect.
- **Fixes found by the checks:**
  - Batch lookups stopped at 500 documents, fewer than A1's 622 words: a fully published level would have hidden lessons. Now bounded by the ids asked for.
  - The level's lessons are read page by page (the cap was 100).
  - "Next lesson" skips lessons that are published but not fully available.
  - "Level complete" no longer waits for modules with no published lesson yet, and "N of M modules" counts only modules learners can complete.
- **Learner QA:**
  - Guest state is validated field by field and size-capped; corrupted storage no longer breaks a page.
  - Exam drafts are kept in versioned `localStorage` (`lib/exams/draft.js`) and survive closing the browser. Guests keep their start time, so the clock doesn't restart; an attempt whose time ran out while away is discarded unscored; the overview offers "Continue your practice exam".
  - An ended session shows "Sign in again", which returns to the same page.
  - Learner routes have a loading state.
  - The lesson result no longer says "Almost there" for a lesson not started; weak skills say how many exercises they rest on.
- **Goethe Prep:**
  - What each Teil of a part asks, from the published format (reference metadata; `bun run seed -- --update-references` for existing databases).
  - What LGA practises and what not: Schreiben Teil 2 and Sprechen with a partner are stated as not practised.
  - Evidence per part (fully right, to practise again, lessons, latest exam result).
  - One suggested exercise with its reason, by fixed rules.
  - A way back from the exercise to the part (`?from=goethe-<part>`).
- **Tests:**
  - unit: `continuation`, `exam-draft`, more cases in `journey` and `curriculum-modules` (Goethe links, QA findings resolve)
  - integration: `readiness`
  - E2E: `journeys` (review retry, exam persistence and expiry, Goethe return path, corrupted storage, session expiry, slow server) and `readiness`

## 2026-09-30: Bulk selection in admin lists
- Every admin list (levels, modules, lessons, exercises, grammar, vocabulary, exams, review queue, media) and the module review page has row checkboxes, "select all on this page" and an action bar.
- Content steps: Mark reviewed, Approve, Publish, Unpublish, Back to draft, Archive, Restore. Media: Archive, Restore.
- Each selected item goes through the normal per-item rules (permissions, no skipped steps, publish readiness). Items in the wrong state are skipped; blocked ones are listed with the reason.
- At most 200 items per step. Service: `contentService.bulkSelectionTransition`, `mediaService.bulkSetCurriculumMediaStatus`. UI: `components/admin/BulkSelection.js`.

## 2026-09-30: Learner experience and guest learning
See [LEARNER.md](LEARNER.md).
- **Learning without an account.** Every learner page is open to guests: dashboard, lessons, review, Goethe Prep, practice exams and onboarding. Only `/admin` and stored exam attempts need a session.
  - Guests get the same content and the same server grading. Nothing is stored for them; the only write is a per-IP rate-limit counter.
  - Their progress is kept in the browser (`localStorage`, versioned).
  - Curriculum audio and images play for guests; private recordings stay owner-only.
- **One engine, two stores.** `lib/learning/journey.js` holds every learner-facing calculation as pure functions of the level structure and the learner state.
  - The server runs them for signed-in learners, the browser for guests.
  - Module summaries in `curriculumService` now use them too, with unchanged output.
- **Learner home** (`/dashboard`):
  - one primary action ("Continue: Modul X · Lesson")
  - today's plan (deterministic)
  - lessons completed and skills across the level
  - review and Goethe Prep summaries
  - modules
- **Navigation:** Learn · Review · Goethe Prep · Account. On phones this is a bottom tab bar, hidden inside lessons and running exams.
- **Lesson result** (`?view=result`): points, what to practise again, the next lesson. Finished modules show "Module complete!" with the next module.
- **Review** (`/review`): words due and exercises to practise again, grouped by lesson with its grammar, plus weak skills. Each item links back to the exercise.
- **Goethe Prep** (`/goethe/<level>`, `/<part>`): the lesson exercises linked to each exam part through `refs`, with practised count and score. Practice exam results link each section to its part.
- **Onboarding** (`/start`): goal and starting module; no placement test. Stored on `users.learningProfile`, or in the browser for guests.
- **Guest nudge:** "Create a free account to keep your progress" (non-blocking). Registration now honours `?next=`.
- Skills show "% right" (attempted exercises) next to progress towards the level target (unattempted exercises count as 0). "Needs work" only uses attempted exercises.
- New files:
  - `lib/learning/{state,journey,guestStore,profile}.js`
  - `lib/services/{journeyService,learningProfileService}.js`
  - `lib/security/guestRateLimit.js`
  - `app/actions/guest.js`
  - `components/journey/*`, `components/learn/{GuestLesson,LessonResult,SaveProgressNudge}.js`, `components/exams/GuestExam.js`, `components/layout/LearnerNav.js`
- Not built (decisions 2026-09-30): activity streak; moving guest progress into a new account.

**Tests:** `tests/unit/journey.test.js`, `tests/integration/guest-learning.test.js` and `tests/e2e/guest.spec.js` are new. `auth`, `learner` and `speaking` E2E specs were updated for open learning and the lesson result.

## 2026-09-30: Bulk vocabulary import
See [CMS.md](CMS.md#cms-bulk-vocabulary-import).
- New page `/admin/vocabulary/import`: up to 5,000 words per import, from a CSV file (UTF-8, comma or semicolon separated) or rows pasted from a spreadsheet. A CSV template can be downloaded.
- The preview shows errors and warnings per row. Rows can be removed, and rows with problems or rows that failed can be exported as CSV.
- The word editor's rules apply: every row becomes the editor's payload and is validated with `vocabularySchema` on the server, for the preview and again for the import. A duplicate level + slug is an error; the same word is a warning. Imported words are drafts.
- New files:
  - `POST /api/admin/vocabulary/import` (origin check, `content:write`, rate limit, 3 MB body)
  - `lib/content/csv.js` (RFC 4180 parser)
  - `lib/content/vocabularyImport.js`
  - `lib/services/vocabularyImportService.js`
- New repository methods: `insertMany` and `findByLevelSlugs` in the content repository, and `vocabularyRepository.findByLemmas`.
- The CMS source-type options moved to `lib/content/constants.js` (`SOURCE_TYPE_OPTIONS`), shared by the word editor and the import.

## 2026-09-29: A1 curriculum expansion and exam engine
See [CURRICULUM-A1.md](CURRICULUM-A1.md#2b-modules-212-implemented-2026-09-29) and [EXAMS.md](EXAMS.md).

**Curriculum**
- Modules 2–12 of A1, following the 12-module plan: four lessons and a module test each, and review lessons after modules 3, 6, 9 and 12. The level now has 65 lessons, 622 words, 50 grammar topics and 272 exercises.
- Everything is AI-drafted, seeded as draft/unpublished, and has no Bangla. It needs review before learners see it.
- Level-wide integrity tests: no word defined twice, no orphans, and every module registered in order.

**Exams**
- New content collection `exams`: sections of library exercises, time limit, pass mark and review policy. It goes through the normal review and publish lifecycle.
- New per-learner collection `examAttempts`:
  - start and resume
  - a frozen snapshot of the exam and a secret shuffle seed per attempt
  - one-time submission, graded on the server by the existing `gradeExercise`
  - 60 s grace after the deadline, then the attempt is closed as expired
  - no changes once submitted
  - result views per policy (summary / marks / full)
- Learner UI:
  - *Practice exams* on the level page
  - `/exams/[level]/[slug]` with the rules and history
  - `/exams/attempts/[id]` for taking the exam: tasks, palette, timer, confirmation, result and review
- Admin: `/admin/exams` list, editor, readiness, bulk review of the exam and its exercises, and a preview that writes nothing.
- Seeded practice exam *A1 Probeprüfung 1*: 35 questions in Goethe format (Hören, Lesen, Schreiben Teil 1), all auto-scored.
- Engine change: optional `seedPrefix` for shuffles. Default behaviour is unchanged.
- New indexes: `exams` and `examAttempts`. Run `bun run db:indexes`, then `bun run seed`.
- Audio tooling (`audio:generate`, `audio:verify`) and the E2E seed now cover the exam's audio (`content/audioContent.js`).

**Tests:** 5 new files (exams unit, exam content, curriculum modules, exams integration, curriculum-a1 integration) and 1 E2E spec. The full suite passes: 396 unit/integration tests, 44 E2E (6 desktop-only skipped on mobile).

## 2026-09-29: CMS Phase 5, curriculum images
See [CMS.md](CMS.md#cms-phase-5-curriculum-images).

- The media library takes images as well as audio: PNG, JPEG, WebP and GIF, up to `CURRICULUM_IMAGE_MAX_BYTES` (2 MB) and 8000 px per side. SVG is rejected. The server checks the signature, declared type, extension, header structure and dimensions, and stores the width and height.
- Optional `image: { mediaId, alt, caption? }` on intro blocks, words and exercise stimuli. Alt text is required, in at least one language. Editors get an image panel (picker with thumbnails, preview, change, remove, alt text and caption). Saving follows the normal draft and publish rules.
- Learners see images in the lesson UI (intro, flashcard answer side, exercise stimulus) and on the `/review` flashcards, and the draft preview uses the same code. Missing or archived images are left out without breaking the lesson.
- Learner access: an image loads only while approved, published content attaches it. Archive, delete and replace rules and *Used by* now count every place that can reference media.
- New indexes: `lessons.blocks.image.mediaId`, `vocabulary.image.mediaId`, `exercises.stimulus.image.mediaId`. Run `bun run db:indexes`.
- Renamed in the admin UI: *Upload audio* is now *Upload media*.

**Tests:** 15 integration, 11 unit and 1 E2E test added. The full suite passes: 268 unit/integration tests, 41 E2E.

## 2026-09-29: CMS Phase 3, draft learner preview
See [CMS.md](CMS.md#cms-phase-3-draft-learner-preview).

- **Preview as learner** on the lesson editor and the module review page opens `/admin/lessons/[id]/preview`: the real learner lesson UI for a lesson in any lifecycle state, with a Draft preview banner (status, version, unpublished and archived linked items).
- The learner page and the preview share `buildLessonView` (`curriculumService`) and `components/learn/LessonView.js`. `getLessonPreview` and `previewExerciseAttempt` require `content:read-drafts`.
- Strictly read-only: exercises are graded and revealed on the server without storing anything. Word ratings, block completion and speaking takes stay in the browser. No rate-limit counter or attempt log is written.
- Learner routes, APIs, write checks and media access rules are unchanged.

**Tests:** 8 integration tests (including a full database snapshot before and after every preview operation) and 1 E2E test added. The full suite passes: 242 unit/integration tests, 40 E2E.

## 2026-09-29: CMS Phase 2, curriculum media and audio
See [CMS.md](CMS.md#cms-phase-2-curriculum-media-and-audio).

**Media library**
- `/admin/media`: list, search, filter by source, status and usage, and page. Upload with progress, preview, metadata editing, file replacement, archive/restore, and deleting unused audio.
- Upload endpoint `POST /api/admin/media`, replacement `PUT /api/admin/media/:id`. Checks: same-origin request, `media:manage` permission, rate limit and byte limit (`CURRICULUM_MEDIA_MAX_BYTES`, 4 MB); signature, declared type, extension and MP3 structure; server-generated storage keys.

**Exercises**
- Optional `mediaId` on `stimulus.audio` and `items[].audio`. It is validated on save: it must be an active native or licensed upload.
- Resolution order: recording, then generated TTS, then unavailable.
- The exercise editor has an audio panel per listening target (state, TTS status, picker, preview, remove). The exercise list has an *Audio* column.
- Publishing, module review and `content:check` accept either a recording or TTS.

**Access and data**
- New `mediaAssets` visibility `linked`: learners can play an upload only while an approved, published exercise uses it.
- `seed --update` keeps attached recordings.
- New indexes: `mediaAssets {source, createdAt}`, and `exercises` `stimulus.audio.mediaId` / `items.audio.mediaId`. Run `bun run db:indexes`.

**Tests:** 15 integration, 9 unit and 1 E2E test added. The full suite passes: 234 unit/integration tests, 39 E2E.

## 2026-09-29: CMS Phase 1, admin content authoring
Admins create and edit levels, modules, lessons (block composer), vocabulary, grammar topics and exercises in `/admin`. See [CMS.md](CMS.md).

## 2026-09-29: A1 Phase 3
Speaking recordings, the audio production tooling (TTS generation, smoke test, verification) and Atlas validation tooling. See [ARCHITECTURE.md](ARCHITECTURE.md).

## 2026-09-27: A1 Phases 1–2
Foundation (auth, lifecycle, data layer), then the learning engine and A1 Module 1. See [ARCHITECTURE.md](ARCHITECTURE.md) and [CURRICULUM-A1.md](CURRICULUM-A1.md).
