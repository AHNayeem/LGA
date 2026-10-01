# CMS Phase 1: admin content authoring

Status: implemented 2026-09-29. An authenticated ADMIN can create and edit the core curriculum (levels, modules, lessons, vocabulary, grammar topics, exercises and lesson blocks) in `/admin`, without changing code or seed files. Learners read the same MongoDB documents as before; nothing in the learner model changed.

Curriculum media (upload, attach and preview recorded audio, TTS status) was added in [CMS Phase 2](#cms-phase-2-curriculum-media-and-audio), the draft learner preview in [CMS Phase 3](#cms-phase-3-draft-learner-preview), and curriculum images in [CMS Phase 5](#cms-phase-5-curriculum-images), below. Exam authoring (`/admin/exams`, editor, bulk review and preview) is described in [EXAMS.md](EXAMS.md#cms).

## What it builds on
CMS Phase 1 extends the existing layers. It adds no parallel system.

| Existing piece | How the CMS uses it |
|---|---|
| `contentService.createContent` / `updateContent` | The only write path. `saveContent` dispatches to them |
| Zod schemas in `lib/validation/content.js` and `lib/exercises/types/*` | Validate every payload on the server; their field errors are shown next to the inputs |
| `lib/content/lifecycle.js` (`initialLifecycle`, `editPatch`, `publishPatch`) | New content is draft/unpublished. Edits bump the version and send reviewed, approved or published content back to draft, unpublished |
| `contentRepository.updateIfVersion` | Optimistic concurrency: a stale version is a `ConflictError` ("changed by someone else") |
| `transitionReview`, `setPublishStatus`, `bulkModuleTransition` and their actions | Review, approve, publish, unpublish, and archive/restore (`publishStatus: archived`) |
| `hasPermission` / `PERMISSIONS` (`content:write`, `content:read-drafts`, …) | Checked in the service for every CMS read and write |
| `requireAdminPage` (layout and each page) and `requireUser` (actions) | Page gate and action authentication |

## Changes to shared code
- **Relationship checks** (`assertRelations` in `contentService`, applied by `createContent` and `updateContent`):
  - a lesson's `moduleId` must exist
  - `grammar` blocks must reference a grammar topic, exercise blocks an exercise, and `vocabulary` blocks existing words, with no word twice in one block
  - a level's `code` can't change after creation, because modules refer to levels by code

  Referenced items may be in any lifecycle state. Publishing still requires them to be published.
- **Cleared fields**: `updateContent` now sets optional body fields to `null` when the new payload no longer contains them (for example a removed description, example or stimulus). This is the convention `seed --update` already used. The shared helper is `removedFields` in `lifecycle.js`, now used by both the seed and the CMS.
- **Admin reads** (`contentService`):
  - `listContentForAdmin(actor, kind, query)` now supports search, filters and pagination (`adminListQuerySchema`). Invalid URL values are ignored, and archived content is hidden unless asked for.
  - new reads: `getContentForAdmin`, `searchContentOptions` (pickers), `listEditorOptions`, `getAdminOverview`
  - `contentRepository.countByStatus()` supplies the dashboard counts
- **Constants** that client editors need (level codes, parts of speech, block types, voices, item-type labels) moved to `lib/content/constants.js`, which has no dependencies. The schemas import and re-export them, so there is still one definition.

## Server Actions (`app/actions/content.js`)
| Action | Purpose |
|---|---|
| `saveContentAction({ kind, id?, version?, data })` | Create (no `id`) or update the given version. `kind` must be one of `EDITABLE_KINDS`. Lifecycle and audit fields in `data` are stripped by the schemas and can't be set |
| `searchContentAction(kind, query)` | Read-only search for the lesson composer: vocabulary, grammar topics, exercises (drafts included, archived excluded) |
| `transitionReviewAction`, `setPublishStatusAction`, `bulkModuleTransitionAction` | Unchanged. Archive and restore use `setPublishStatusAction` with `archived` / `unpublished` |

Each action authenticates with `requireUser()` and passes the actor to the service, which authorises the call. Hidden fields, client roles and client lifecycle values are never trusted.

## Routes
| Route | Content |
|---|---|
| `/admin` | Dashboard: counts per content type and state (linked to filtered lists), plus the existing levels and modules tables |
| `/admin/levels`, `/new`, `/[id]` | Code, order, title, description, mastery thresholds, tags, refs, provenance |
| `/admin/modules`, `/new`, `/[id]/edit` | Level, slug, order, title, description, goals, mastery overrides |
| `/admin/modules/[id]` | Existing module review page (bulk steps), now with links to edit the module, add a lesson and edit each item |
| `/admin/lessons`, `/new`, `/[id]` | Lesson fields and the **block composer** |
| `/admin/vocabulary`, `/new`, `/[id]` | Word library: search by word/plural/meaning/slug, filter by level, part of speech, topic, review and visibility |
| `/admin/grammar`, `/new`, `/[id]` | Grammar topics with sections (heading, body, table, examples) that can be added, removed and reordered |
| `/admin/exercises`, `/new`, `/[id]` | Exercise builder |
| `/admin/review` | Review queue across all types (drafts / reviewed / approved-not-published / published / archived), plus links to each module's bulk review |

Lists are paginated (50 per page) and filtered through GET parameters, so they are bookmarkable. Every list shows review and visibility badges, test-fixture approvals and AI provenance. `loading.js` and `error.js` in `app/admin` handle the loading and error states. Empty lists explain what to do next. After a create, the editor shows a "created as a draft" notice; after a save, the new version and state.

## Editors (`components/admin/editor/*`)
- `payload.js` holds pure conversions between stored documents and editor state. The payload primitives, `slugify` and `vocabularyPayload` live in `lib/content/payload.js` (shared with the bulk vocabulary import) and are re-exported from it. Payload builders drop only empty optional values. Validation is left to the server schemas, and `tests/unit/cms-payload.test.js` round-trips all Module 1 content through them without any change.
- `EditorShell.js` sends the payload and shows field errors next to the inputs (via `ErrorsContext`) plus a summary of all of them. On a version conflict it offers a reload. It warns before editing approved or published content that saving returns it to draft.
- `fields.js` and `groups.js` provide inputs, `{de,en,bn}` inputs, list controls (up/down/remove), provenance, tags and reference links, and the mastery editor (inherit / override / "not assessed here" = `null`).
- `simpleEditors.js` covers levels, modules, vocabulary and grammar. The article is required for nouns (the existing schema rule), and a slug is suggested from the title or lemma for new items.
- `ExerciseEditor.js` has level, skill, instructions, and a stimulus (reading text, text kind, listening lines as audio *cues*, transcript policy, max plays). Items can be added, removed and reordered. Each item gets a type-specific editor for `mcq`, `true_false`, `text_input`, `match`, `order` and `speak_prompt`, including the answer key, optional item audio cue and explanation. The editor also sets the pass threshold and per-item play limit. The page shows points and missing generated audio (publishing is blocked until `audio:generate` has run).
- `LessonEditor.js` + `ContentPicker.js` form the block composer:
  - blocks can be added, removed and reordered, for all ten block types
  - vocabulary blocks pick, reorder and remove words from the library
  - grammar and exercise blocks pick one item; the default filter is the block's skill, and a skill that differs is flagged
  - blocks store only ids
  - saved block keys are locked, because learner progress is stored per key
  - the page lists which linked items are not published yet

## Security
- Every CMS read and write checks permissions in `contentService`. Pages also check `requireAdminPage`, and actions `requireUser`.
- `kind` is limited to `EDITABLE_KINDS`, ids are validated `ObjectId` strings, and the version must be an integer.
- List filters come from the URL and are parsed by `adminListQuerySchema`. Search text is regex-escaped and capped at 100 characters.
- Tests cover USER and anonymous actors against every CMS entry point, and forged lifecycle/audit fields.

## Tests
| File | Covers |
|---|---|
| `tests/integration/cms.test.js` (19 tests) | Non-admin and anonymous callers rejected by every CMS read/write. Only editable kinds accepted. Forged lifecycle fields ignored. Validation errors with field paths. Stale/missing versions and duplicate slugs. Level code immutable. Module fields and clearing of removed fields. Lesson composition stored as ids, block reordering keeps keys, missing module / wrong-collection refs / duplicate words rejected. Vocabulary CRUD, search (meaning, plural, regex characters), filters, pagination, archive/restore. Grammar sections add/remove/reorder. Exercises with all six item types, edits, invalid questions, publish readiness (audio). Unpublished CMS content invisible to learners until the whole chain is published; edits and archiving hide it again. Dashboard counts |
| `tests/unit/cms-payload.test.js` (11 tests) | Every Module 1 level, module, word, grammar topic, exercise and lesson survives editor state → payload unchanged. Empty-field handling, mastery modes, item-type switching, the editor's item types match the registry, slug/id/key helpers |
| `tests/e2e/cms.spec.js` (3 tests) | Real UI on the production build: create a word (server validation error, then success), edit it, find it in the list. Compose a lesson with an intro and a picked word, reorder, save; learners don't see the draft (module page and direct URL 404). A learner is redirected away from the CMS pages |

Results on 2026-09-29:
- `bun run lint`: clean
- `bun run test`: 21 files, 210 tests passed
- `bun run build`: succeeded
- `bun run test:e2e`: 38 passed, 2 skipped (the two authoring tests are desktop-only, so they skip on the mobile project)

The Atlas commands (`test:atlas`, `test:e2e:atlas`) and `content:check` need a real Atlas cluster and were not run in this phase.

## Known limitations
- **No hard delete.** Archiving (`publishStatus: archived`) is the soft delete. Archived items are hidden from learners, default lists and pickers, and "Restore" returns them to unpublished. Archiving something a published lesson uses makes that lesson unavailable (fail closed). The edit page lists the lessons using a word, grammar topic or exercise.
- **Changing a lesson's module, a module's level or a slug** is allowed. It changes learner URLs; progress is stored by id and is kept.
- A module's `levelCode` is validated against the CEFR codes, but a level document is not required to exist (all six are seeded). Learners never see a module whose level isn't published.
- Mismatches between block type and exercise skill are flagged in the composer but not rejected (the existing schema allows them, e.g. `practice` blocks with any skill).
- Audio in exercises is edited as cues (text, voice, speed), and TTS clips are still generated offline. Phase 2 added recorded audio from a media library (see below).
- Pickers show the first 20 matches, and the dashboard lists up to 100 modules.
- There is no autosave, unsaved-changes prompt or edit history (only the version number and audit fields). Preview-as-learner was added in Phase 3.
- References (book and exam metadata) can be linked but are not edited in the CMS. They stay seed data.

## Next phase
Implemented as CMS Phase 2 (below).

# CMS Phase 2: curriculum media and audio

Status: implemented 2026-09-29. An ADMIN can upload recorded German audio in `/admin/media`, attach it to listening exercises, preview it and see the audio state of every listening exercise, without changing curriculum or seed files. Generated TTS keeps working unchanged and is the fallback wherever no recording is attached.

## Model
```
Listening exercise ─ stimulus.audio.lines[]   (cues: transcript + TTS input, unchanged)
                   └ stimulus.audio.mediaId?  → mediaAssets (native | licensed upload)
        item ──────── items[].audio {cue}      (unchanged)
                   └ items[].audio.mediaId?   → mediaAssets (native | licensed upload)
No mediaId → cue hash → mediaAssets (tts)   (existing lookup, lib/services/audioService.js)
```
- **One optional id per listening target.** A target is the stimulus passage or one item's audio. Nothing else changed in the exercise schema (`stimulusAudioSchema` and `itemAudioSchema` in `lib/audio/cues.js`). The cue lines stay required: they are the learner transcript and the TTS fallback. Audio data is never copied into exercises.
- **Stored as an ObjectId** (`toStorage` in `contentService`) and read back as a string. Model-answer audio (`modelAudio` on speaking prompts) has no attachment.
- **Existing content needs no migration.** No seeded exercise has a `mediaId`, and `tests/unit/curriculum-media.test.js` checks that all of Module 1 still parses unchanged.
- **`seed --update` keeps attachments.** The seed files know nothing about recordings, so the update copies an existing `mediaId` onto every target that still exists (`keepAttachedMedia` in `seedService`).

### `mediaAssets`: three kinds of audio
| | Learner recording | Generated TTS | Curriculum upload (new) |
|---|---|---|---|
| `source` | `learner` | `tts` | `native` (own speaker) or `licensed` (third party, `license` required) |
| `visibility` | `private` | `curriculum` | `linked` (new) |
| Identified by | `ownerId` + `recording` subdocument | `ttsHash` | id, referenced from exercises |
| Managed by | learner / `media:cleanup` | `audio:generate` + `seed` | `/admin/media` |
| New fields | – | – | `status` (`active` \| `archived`), `title`, `originalName` (display only), `updatedAt`/`updatedBy` |

Existing fields (`kind`, `mime`, `storage`, `size`, `durationSec`, `language`, `voice` = speaker, `license`, `transcript`, `ownerId: null`, `createdBy`) keep their meaning. Bytes go to the configured driver (GridFS in production) under a server-generated key, `curriculum/<uuid>.<ext>`. No new storage provider was added.

## Audio resolution order
The same rule is used for learner pages, admin status, publishing and `content:check`:
1. **Attached recording**, if it is an active `native`/`licensed` upload. For a stimulus, the single recording replaces the per-line TTS sequence, and `maxPlays` still applies.
2. **Generated TTS** for the cue(s), found by hash as before.
3. **Development only:** the browser voice. Otherwise the target is `unavailable`.

An archived or deleted recording is skipped, so the target falls back to TTS and never breaks. The implementation is `createAudioResolver(cues, { mediaIds })` / `createExerciseAudioResolver` in `audioService`, with `stimulusSources` in `lib/exercises/engine.js`. Learner payloads contain only `/api/media/:id` URLs, as before.

## Publishing
`missingRequiredAudio(exercise)` replaces the per-cue TTS check in `assertPublishable`, `getContentForAdmin`, `getModuleReview` and `content:check`. A target is playable if it has a usable recording **or** TTS for all its cues. A listening exercise with any unplayable target stays blocked: "N audio clip(s) have no playable audio…". All other checks (dependencies, grading, lifecycle) are unchanged.

## Admin workflow
1. **Upload:** `/admin/media/new`. Choose a file, a title, the source, and optionally a speaker and a license. A progress bar shows the upload. After it succeeds, the detail page opens.
2. **Attach**, either way:
   - in the **exercise editor**: each listening passage and item audio has an audio panel. It shows the state (`Native audio attached` / `TTS fallback` / `Audio missing`), the TTS status of the saved version ("2 of 4 clips generated"), a preview, *Attach a recording* (library picker with search, source filter and preview), *Change*, *Remove (use TTS)* and *Upload new audio*. The id is saved with the exercise.
   - on the **media detail page**: *Attach to a listening exercise* (exercise picker, then the passage or a question). This goes through `setExerciseAudioMedia`.

   Attaching or removing is an ordinary exercise edit. The version is checked, and reviewed/approved/published exercises return to draft, because what learners hear has changed.
3. **Review and publish** the exercise as usual.
4. **See status:** the exercise list has an *Audio* column, and the exercise page header and the module review page count unplayable clips.
5. **Maintain** on `/admin/media/[id]`:
   - edit the metadata, see *Used by* (with *Remove from passage/question*) and *Replace file*
   - *Archive → Delete permanently* when the recording is unused

TTS generation stays an offline CLI step (`bun run audio:generate`). The admin UI only reads its status and never calls a TTS provider.

## Media lifecycle
| Action | Rule |
|---|---|
| Upload | `status: active`, `visibility: linked`. Invisible to learners until a published exercise uses it |
| Replace file | Same id, new bytes. Only while **no reviewed/approved exercise** uses it; otherwise upload a new recording and attach it, so the change is reviewed. New bytes are stored first, the document is swapped only if the old key is unchanged, then the old bytes are deleted |
| Remove attachment | Only the exercise changes. The recording stays in the library, filterable as *Unused* |
| Archive | Only when **no exercise** (any state) references it. Archived audio is hidden from pickers and the default list, rejected on save and never played. Restore returns it |
| Delete | Only **archived and unreferenced** audio. The reference count is checked again, then the metadata and the bytes are removed. Archiving first closes the window in which an editor could attach it |

Reference counts come from indexed queries on `stimulus.audio.mediaId` and `items.audio.mediaId` (`findExercisesUsingMedia`, `countExercisesUsingMedia`, `referencedMediaIds`). Learner recording cleanup is not affected: every curriculum query is limited to `native`/`licensed`, and the old `deleteMedia` routes curriculum uploads to these rules.

## Routes, actions and services
| Piece | Location |
|---|---|
| Library pages | `app/admin/media/page.js` (list: search in title, file name, transcript and speaker; filters for source, status and usage; 50 per page), `new/page.js`, `[id]/page.js` |
| Upload / replace (raw body) | `POST /api/admin/media`, `PUT /api/admin/media/:id` → `lib/http/curriculumUpload.js` |
| Server Actions | `app/actions/media.js`: `updateMediaAction`, `setMediaStatusAction`, `deleteMediaAction`, `searchMediaAction`, `exerciseAudioTargetsAction`, `setExerciseAudioMediaAction` |
| Media service | `mediaService`: `uploadCurriculumMedia`, `replaceCurriculumMediaFile`, `updateCurriculumMedia`, `setCurriculumMediaStatus`, `deleteCurriculumMedia`, `listCurriculumMedia`, `getCurriculumMediaForAdmin`, `searchCurriculumMedia`, `validateCurriculumAudio`, `canReadMedia` (now async) |
| Content service | `setExerciseAudioMedia`, `listExerciseAudioTargets`, relationship check `assertExerciseMedia`, audio status in `getContentForAdmin` and `listContentForAdmin` (exercises) |
| Audio service | `createAudioResolver(cues, { mediaIds })`, `createExerciseAudioResolver`, `missingRequiredAudio`, `exerciseAudioStatus(es)`, `isUsableCurriculumMedia` |
| UI | `components/admin/media/*` (labels and badges, upload form, detail controls) and `components/admin/editor/AudioAttachment.js`; *Media* in the admin nav |
| Indexes | `mediaAssets {source, createdAt}`; `exercises` `stimulus.audio.mediaId`, `items.audio.mediaId` (partial). Run `bun run db:indexes` |

## Security
- **Authorization:**
  - every media read and write requires `media:manage`
  - attaching also requires `content:write`
  - pages use `requireAdminPage`, and actions and route handlers resolve the session
  - USER gets 403 (upload) or `ForbiddenError`; anonymous callers get 401
- **Upload order** (as for learner recordings):
  1. same-origin check (CSRF)
  2. session
  3. permission, metadata validation and rate limit (`upload:curriculum`, 120/hour)
  4. only then is the body read, with a byte limit on both `Content-Length` and the streamed count (`CURRICULUM_MEDIA_MAX_BYTES`, default 4 MB, below Vercel's 4.5 MB request limit)
- **File checks** (`validateCurriculumAudio`), none of which trust the client's MIME type or file name:
  - the signature (magic bytes) must be MP3, M4A/MP4, Ogg, WAV or WebM
  - the declared `Content-Type` must match the detected format
  - the file name's extension must match too (`extensionMatches`)
  - MP3s must parse frame by frame (`lib/audio/mp3.js`), which also gives the server-side duration
  - anything else is rejected with a 400; oversized files get a 413
- **No paths leave the server.** Storage keys are generated server-side, and the admin view (`adminMediaView`) contains no driver or key. The original file name is sanitized and shown for display only.
- **Playback** (`/api/media/:id`, `canReadMedia`):
  - admins can always preview
  - a learner can read a `linked` upload only while an **approved and published** exercise attaches it and the upload is active
  - drafts, unpublished and archived content never expose it, and "missing" and "forbidden" both return 404
  - `linked` responses are `private, no-cache` (access can end, and a replaced file keeps its id)
  - all uploads are served with `Content-Security-Policy: sandbox` and `nosniff`
  - learner recording rules are unchanged

## Tests
| File | Covers |
|---|---|
| `tests/integration/curriculum-media.test.js` (15) | ADMIN upload vs. USER/anonymous/cross-site, and USER against every media entry point. Valid MP3/WAV/WebM. Wrong MIME, disguised file, wrong or missing extension, damaged MP3, empty file, FLAC, oversize (declared and streamed), metadata validation. Library search, filters, pagination, learner recordings excluded. Metadata edit, archive/delete rules and removed bytes, replace rules. Attach via the editor payload and via the library, stored as ObjectId, survives reload, replace, remove, version conflict, bad target. Unknown, archived, learner and TTS ids rejected. `seed --update` keeps attachments. Resolution native → TTS → unavailable, archived falls back. Publish with native, with TTS, blocked with neither. Learner access only while the exercise is published (on the real Module 1 lesson) |
| `tests/unit/curriculum-media.test.js` (9) | Extension check, validation order, URL filter parsing, schema (optional id, lines still required), targets and covered cues, engine fallback and no id leak, editor payload round-trip and clearing |
| `tests/e2e/media.spec.js` (1, desktop) | Real UI: a disguised file is rejected, a real MP3 is uploaded and previewed, a new listening exercise gets the recording through the editor picker, it is still attached after a reload, the library shows the usage, and a learner gets 404 |

Results on 2026-09-29:
- `bun run lint`: clean
- `bun run test`: 23 files, 234 tests passed
- `bun run build`: succeeded
- `bun run test:e2e`: 39 passed, 3 skipped (desktop-only authoring tests on the mobile project)

One Phase 1 assertion (`checks` in the exercise test) was extended with the new `audio` field; it still compares the whole object exactly. `test:atlas`, `test:e2e:atlas` and `content:check` need a real Atlas cluster and were not run.

## Known limitations
- **Audio only.** There are no images, and `kind` is always `audio`. (Images were added in [CMS Phase 5](#cms-phase-5-curriculum-images).)
- **One recording per target.** A stimulus recording replaces the whole line sequence. There are no per-line recordings, and speaking model answers can't take recordings.
- **Waveform, duration and loudness are not normalized.** The duration is measured on the server for MP3 and reported by the browser for other formats (display only).
- **The 4 MB upload limit** comes from the serverless request body. Longer recordings need a lower bitrate, or later a direct-to-storage upload.
- **Learner access checks the exercise, not the whole chain.** A recording is readable while its exercise is approved and published, even if that exercise's lesson is not; the lesson itself still doesn't show. Media ids are unguessable ObjectIds and are never listed to learners.
- **TTS status reflects the saved version.** Editing cue text in the editor doesn't re-check TTS until saved. Generation is still only the CLI.
- **Replacing a file** used by reviewed content is blocked rather than re-triggering review.
- **No media edit history.** Only `updatedAt`/`updatedBy` are recorded.

## Next phase (recommended)
A learner preview of draft lessons for reviewers, including attached recordings (implemented as [CMS Phase 3](#cms-phase-3-draft-learner-preview)), and an edit history/diff for reviewed content (exercise attachments included). After that: images in the media library, and a direct-to-storage upload path if longer recordings are needed.

# CMS Phase 3: draft learner preview

Status: implemented 2026-09-29. An authorised reviewer opens any lesson (draft, reviewed, approved, published or archived) with **Preview as learner** and plays it through the real learner lesson UI, without publishing it and without writing anything to any persistence layer.

## What it builds on
There is no separate preview renderer. The learner page and the preview share the lesson data builder and the lesson UI. Only the data source and one `preview` flag differ.

| Piece | Learner lesson | Draft preview |
|---|---|---|
| Route | `/learn/[level]/[module]/[lesson]` (unchanged URL and checks) | `/admin/lessons/[id]/preview?block=` (admin layout, `requireAdminPage`) |
| Read | `getLearnerLesson`: `LEARNER_VISIBLE` chain, fail closed | `getLessonPreview`: `content:read-drafts`, the lesson, module, level and every linked item in any state |
| View data | `buildLessonView` with the learner's progress, word-review states and recordings | `buildLessonView` with no learner state: nothing done, no stats, no review states, no recordings, no next lesson |
| UI | `components/learn/LessonView.js` | the same `LessonView` with `preview` plus `PreviewBanner` |
| Exercise check | `submitExerciseAction` → `submitExerciseAttempt` (stores the attempt, progress and recordings) | `previewExerciseAction` → `previewExerciseAttempt`: same schema, `gradeExercise` and `revealExercise`, **no writes** |
| Audio | `createExerciseAudioResolver`: attached recording, then TTS, then browser voice (development only) | identical. Admins can already play every curriculum upload (`canReadMedia`, `media:manage`) |

Blocks come from `lesson.blocks` in stored order, so the preview shows exactly what learners get once everything is published. `tests/integration/lesson-preview.test.js` checks this by comparing the preview with a new learner's view of every published Module 1 lesson.

## Preview mode (read-only boundary)
Every learner write starts in one of four client components. With `preview` each of them stays in the browser:

| Component | Learner | Preview |
|---|---|---|
| `ContinueButton` (intro, grammar) | `completeBlockAction`, then next step | next step only |
| `Flashcards` (vocabulary) | `reviewVocabularyAction` per card (spaced repetition), then `completeBlockAction` | ratings kept in component state, then next step |
| `ExercisePlayer` | `submitExerciseAction` | `previewExerciseAction` (graded on the server, nothing stored). Ungraded speaking says "Done (not saved in preview)" instead of "Saved" |
| `SpeakPromptItem` | uploads the take (`POST /api/recordings`), offers "Delete recording" | record and play back in the browser only. No upload, no recording id, no delete. A note says recordings aren't saved |

The server enforces the same boundary on its own:
- `getLessonPreview` and `previewExerciseAttempt` only read. There is no rate limiter, because the existing one stores counters in MongoDB, and no `exercise_attempt` log line.
- A recording id sent to `previewExerciseAttempt` is ignored, never claimed.
- The learner write paths are unchanged and still 404 on anything that isn't live (`loadAvailableLesson`), for admins too. A preview that reached them would fail rather than write.

## Preview banner
Shown on every step (`components/admin/PreviewBanner.js`):
- **Draft preview** label
- the lesson's review and visibility status and version
- "Nothing you do here is saved"
- whether learners can see the lesson
- how many linked items aren't published (and how many of those are archived)
- whether the module or level isn't published
- **Back to the editor**

Unpublished and archived linked items are rendered, so reviewers can check them before publishing. Publishing and dependency rules are unchanged. A lesson with no blocks, or with a linked item that no longer exists, shows the same "unavailable" state learners would get.

## Entry points
- **Preview as learner** on the lesson editor (`/admin/lessons/[id]`) and on each lesson row of the module review page (`/admin/modules/[id]`). Both use `lessonPreviewHref` in `lib/content/adminSections.js`.
- The last step leads back to the lesson editor. The breadcrumb's module link goes to the module review page.

## Security
- **Page:** the admin layout and the page both call `requireAdminPage`. A learner opening the URL is redirected to `/dashboard?error=forbidden`.
- **Services:** `assertCanPreview` requires a signed-in actor (otherwise `AuthenticationError`) with `content:read-drafts` (otherwise `ForbiddenError`). Only ADMIN has it today; a future reviewer role that gets it gains preview automatically.
- **Ids and payloads:** lesson ids are validated. Unknown, malformed or not-in-lesson exercise ids are `NotFoundError`. As for learners, the preview payload contains no answer keys.
- **Learner routes, APIs and media rules are unchanged.** Drafts stay invisible to learners, and a recording on a draft exercise still returns 404 to learners.

## Tests
| File | Covers |
|---|---|
| `tests/integration/lesson-preview.test.js` (8) | ADMIN previews; USER gets `ForbiddenError` and anonymous callers `AuthenticationError` on both entry points. Unknown or malformed ids, and exercises that aren't in the lesson, are not found. Learner reads and every learner write (submit, complete block, word review, recording upload) still 404 on the draft, for learners and admins. All six Module 1 lessons as drafts: block keys, types and order, and the content of every block type (intro, vocabulary, grammar, practice, reading, listening, speaking, writing, mini test, mastery check). No learner state. Published lessons: preview equals a new learner's view, and a learner's own progress never leaks into the preview. Unpublished and archived items counted in the status. Unavailable states. Native recording → one `/api/media/:id` source, playable by the admin and 404 for learners. Without a recording: the TTS sequence. **Zero writes**: every exercise graded right and wrong in preview, then a full snapshot of every collection is unchanged. No storage `put`/`delete`, no `exercise_attempt` log, empty `attempts`/`userProgress`/`userVocabulary`, no learner recordings and no new rate-limit counters |
| `tests/e2e/preview.spec.js` (1, desktop) | Real UI on the production build, using a fresh draft module so Module 1 stays untouched. Upload a recording and attach it to a new listening exercise. Compose a draft lesson (intro, word, grammar, native listening, TTS listening, speaking). Open **Preview as learner**. The banner shows draft, unpublished and module not published, and the steps are in composer order. Flashcards, grammar and exercises (wrong, then right, with transcript) all work. The native recording and the TTS clips are served. A speaking take is recorded and never sent to `/api/recordings`. The lesson is still v1 afterwards. A learner is redirected away from the preview, and the draft lesson and recording are 404 |

Results on 2026-09-29:
- `bun run lint`: clean
- `bun run test`: 24 files, 242 tests passed
- `bun run build`: succeeded
- `bun run test:e2e`: 40 passed, 4 skipped (the desktop-only authoring tests on the mobile project)

`test:atlas`, `test:e2e:atlas` and `content:check` need a real Atlas cluster and were not run.

## Known limitations
- **Always a first visit.** The preview doesn't track which steps you did. Every step shows 0 done, and the lesson is never marked complete, so the "Lesson complete" and "next lesson" states can't be previewed. You can open any step from the step list.
- **Saved version only.** The preview shows the last saved version. Unsaved editor changes aren't shown.
- **Lessons only.** There is no stand-alone preview of a single exercise, module or level.
- **Not rate limited.** The preview check action only reads and is admin-only. The existing rate limiter stores counters in MongoDB, which Phase 3 must not do.

# CMS Phase 5: curriculum images

Status: implemented 2026-09-29. An ADMIN uploads images in `/admin/media` and attaches them to intro blocks, words and exercise stimuli. Learners see them in the real lesson UI once the content is approved and published, and reviewers see them straight away in the draft preview. It is the same media system as Phase 2: the same `mediaAssets` records, storage drivers, upload route, lifecycle, permissions and `/api/media/:id`. No second upload or storage path was added.

## Model
```
Intro block ──── lessons.blocks[i].image     { mediaId, alt: {de,en,bn}, caption? }
Word ─────────── vocabulary.image            (same shape)
Exercise ─────── exercises.stimulus.image    (same shape)
                         └ mediaId → mediaAssets (kind "image", source native | licensed, visibility linked)
```
- **Optional everywhere** (`imageRefSchema` in `lib/validation/content.js`; where images can go: `lib/media/imageRefs.js`).
  - Alt text is required on the attachment, in at least one language, up to 250 characters. It belongs to the attachment, not the file, because what an image must convey depends on where it is used.
  - The media record's own `alt` (plain text) only prefills the English alt text when an image is attached.
  - The caption is optional.
- **A stimulus may be a picture alone.** The stimulus rule is now "text, audio or an image". Listening exercises still need audio.
- **Stored as an ObjectId** (`toStorage`), read back as a string. Existing content has no `image` and parses, stores and renders exactly as before; the Module 1 round-trip tests are unchanged.
- **`seed --update` keeps images** on words, stimuli and intro blocks (matched by block key), the same way it keeps recordings (`keepAttachedImages` in `seedService`).
- **New `mediaAssets` fields for images:** `kind: "image"`, `width`, `height` (read from the file on the server) and `alt`. The existing fields keep their meaning: `mime`, `size`, `storage`, `title`, `originalName`, `source`, `license`, `status`, `createdAt`/`createdBy`, `updatedAt`/`updatedBy`. `durationSec`, `voice`, `transcript` and `language` are `null` for images.
- **Bytes** go to the configured driver (`getStorage()`, GridFS in production, memory in tests) under a server-generated key, `curriculum/<uuid>.<ext>`.

## Supported files
| Format | Signature checked | Extensions | Declared types accepted |
|---|---|---|---|
| PNG | `\x89PNG\r\n\x1a\n`, IHDR first, ends with IEND | `.png` | `image/png` |
| JPEG | `FF D8 FF`, a frame header (SOF) before the image data, ends with EOI | `.jpg`, `.jpeg` | `image/jpeg`, `image/jpg`, `image/pjpeg` |
| WebP | `RIFF…WEBP` with a VP8, VP8L or VP8X header | `.webp` | `image/webp` |
| GIF | `GIF87a` / `GIF89a`, ends with the trailer | `.gif` | `image/gif` |

- **Size:** at most `CURRICULUM_IMAGE_MAX_BYTES` (default 2 MB).
- **Dimensions:** at most 8000 px per side and 40 megapixels. This guards against decompression bombs: small files that decode to huge bitmaps on learners' phones.
- **Not accepted:**
  - **SVG**: it is a document and can carry script
  - AVIF and HEIC: not supported yet
  - anything unrecognised

## Validation (`validateCurriculumUpload` → `validateCurriculumImage`)
The bytes decide the kind, never the client:
1. The image signature is checked first (`lib/media/imageInfo.js`). A file that is neither a known image nor known audio gets one message: "Unsupported file. Upload MP3, M4A, Ogg, WAV or WebM audio, or a PNG, JPEG, WebP or GIF image."
2. Byte limit: 413 if exceeded.
3. The declared `Content-Type` must match the detected format.
4. The file name's extension must match.
5. The header must parse (dimensions, not truncated).
6. Dimension limits.

A WebP (`RIFF…WEBP`) is never taken for a WAV (`RIFF…WAVE`), and an image with an audio `Content-Type` is rejected. Replacing a file keeps the kind: an image can only be replaced by an image, and audio by audio.

The upload route's order is unchanged: origin, session, permission, metadata, rate limit (`upload:curriculum`), then the body. The route reads at most the larger of `CURRICULUM_MEDIA_MAX_BYTES` and `CURRICULUM_IMAGE_MAX_BYTES`, and the per-kind limit applies once the bytes are identified.

## Learner rendering
One path for learners and the preview:
- `buildLessonView` (`curriculumService`) resolves every image on the page with one lookup (`createImageResolver` in `lib/services/imageService.js`) into `{ src: "/api/media/:id", width, height, alt, caption }`.
- Both `getLearnerLesson` and `getLessonPreview` use it, and the `/review` flashcards use the same resolver.
- `components/learn/ContentImage.js` renders the image:

| Where | Component | Placement |
|---|---|---|
| Intro block | `LessonView` | above the text |
| Word | `Flashcards` (lesson and `/review`) | on the answer side, since the picture would give the meaning away |
| Exercise stimulus | `ExercisePlayer` | above the reading text and audio |

- **Accessible:**
  - `alt` is the attachment's alt text in the learner's locale, with `lang` set to the language shown
  - an optional `<figcaption>`
- **Aspect ratio:** the intrinsic `width`/`height` attributes reserve the space before the file loads. `max-w-full h-auto` with a capped height scales it down on phones without distortion (tested at 360 px width).
- **Plain `<img>`:** `/api/media/:id` needs the session cookie and re-checks access on every load, which the `next/image` optimiser can't do.
- **Graceful:**
  - an image that is archived, deleted or not an image resolves to `null` and is left out
  - one that fails to load in the browser removes itself
  - the step around it renders as before
- **No storage details** reach the browser: only the media URL, dimensions and texts.

## Admin workflow
1. **Upload** at `/admin/media/new` (*Upload media*).
   - The same form takes audio and images; its fields follow the chosen file.
   - For images: title, source (*Own image* or *Licensed image*; licensed needs a license), and an optional default alt text.
   - The detail page shows the preview, the dimensions, *Used by*, the metadata form, *Replace file* and *Archive → Delete*.
2. **Attach** in the item's editor: the lesson intro block, the word editor, or the exercise stimulus.
   - Each place has an image panel: *Add an image* (picker with thumbnails, active images only), *Upload new image*, a preview, *Change*, *Remove image*, alt text in de/en/bn, and a caption.
   - Saving is an ordinary content edit: the version is checked, and reviewed, approved or published content returns to draft.
3. **Review and publish** as usual. Publishing is refused if an attached image is no longer usable. This normally can't happen, because images in use can't be archived or deleted.
4. **Library:**
   - `/admin/media` has a *Type* filter (audio or images), thumbnails, and *Used by* counts across exercises, words and lessons
   - the audio picker in the exercise editor lists only audio, and the image picker only images

## Lifecycle and references
Phase 2's rules apply to images unchanged, now counted over every place that can reference media (`MEDIA_REFERENCE_PATHS` in `contentRepository`: exercise audio, exercise stimulus images, word images, intro block images):
- archive only when unused, and delete only when archived and unused
- replace a file only while no reviewed or approved item uses it

`findContentUsingMedia`, `countContentUsingMedia` and `referencedMediaIds` replace the exercise-only queries. New partial indexes: `lessons.blocks.image.mediaId`, `vocabulary.image.mediaId`, `exercises.stimulus.image.mediaId`. Run `bun run db:indexes`.

## Security
- **Authorization** is the same as for audio:
  - every media read and write requires `media:manage`
  - attaching is a content save (`content:write`)
  - the editor data needs `content:read-drafts`
  - USER gets 403 or `ForbiddenError`, and anonymous callers 401
- **Learner access** (`canReadMedia`): a learner can load a `linked` upload only while an approved, published exercise, word or lesson attaches it and the upload is active. "Missing" and "forbidden" both return 404.
  - A draft attachment, or one on content that was unpublished again, is not readable.
  - Tests cover this before and after publishing, and after unpublishing.
- **Serving:** `/api/media/:id` sends the detected type, `nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, and `private, no-cache` for linked uploads.
- **Preview:** `content:read-drafts` is required as before. Admins can load any curriculum image through `media:manage`.

## Tests
| File | Covers |
|---|---|
| `tests/unit/curriculum-images.test.js` (11) | Detection and dimensions for PNG, JPEG, WebP and GIF. Audio and images never confused (WAV vs. WebP). Truncated or damaged headers. Validation order: declared type, extension, empty file, dimension and pixel limits. SVG and HTML rejected with the combined message. Schemas: alt required and limited, images on intro blocks and stimuli (picture-only stimulus), stripped elsewhere. Reference helpers. Learner payload with and without an image. Editor payload round-trips, with no change without an image |
| `tests/integration/curriculum-images.test.js` (15) | Upload of all four formats through the route: kind, dimensions, server key, no storage in the response. USER 403, anonymous 401. SVG, disguised, mismatched type or extension, damaged, dimension bomb, empty and oversize (413) all rejected with nothing stored. Replace keeps the kind and updates the dimensions. Attach through the editor payload (ObjectId, editor summaries, *Used by*, archive blocked), remove, archive and delete (bytes gone). Alt required. Unknown, archived and audio ids rejected as images, and images as audio. USER can't search, attach or edit. Pickers keep the kinds apart. Per-kind metadata. `seed --update` keeps images. On Module 1: a draft image is 404 for learners and shown in the preview, the published one is rendered and readable, and unpublishing ends access. Word and stimulus images with a native recording still playing. Archived or deleted images are left out and the lesson still renders. Publishing refused while the image is unavailable. Replace blocked while reviewed content uses it |
| `tests/e2e/images.spec.js` (1, desktop) | Real UI on the production build: SVG rejected, PNG uploaded with dimensions shown, the *Type* filter, attached to a draft lesson's intro block (alt prefilled, empty alt rejected next to the field, caption), still attached after a reload. Preview renders the loaded image with alt, width, height and caption, and at 360 px keeps the aspect ratio with no sideways scrolling. *Used by* lists the lesson. A learner gets 404 for the image and the draft, and is redirected away from the preview |

Existing specs changed only for renamed labels (`Upload audio` → `Upload media`, `Audio file` → `Audio or image file` in `tests/e2e/media.spec.js`).

Results on 2026-09-29:
- `bun run lint`: clean
- `bun run test`: 26 files, 268 tests passed (242 before, plus 26 new)
- `bun run build`: succeeded
- `bun run test:e2e`: 41 passed, 5 skipped (the desktop-only authoring tests on the mobile project)

`test:atlas`, `test:e2e:atlas` and `content:check` need a real Atlas cluster and were not run.

## Known limitations
- **Three places only:** intro blocks, words and exercise stimuli. Grammar sections, other block types and exercise items (e.g. picture answer options) have no images yet; those need renderer and grading changes.
- **No resizing or re-encoding.** Files are served as uploaded, with no thumbnails, `srcset` or format conversion, which keeps the upload limit small (2 MB). Metadata such as EXIF is not stripped.
- **Formats:** no SVG (on purpose), AVIF or HEIC.
- **Learner access checks the item, not the whole chain** (as for recordings): an image is readable while the word, exercise or lesson that attaches it is approved and published, even if the lesson around a word isn't. The lesson itself still doesn't show, and ids are unguessable and never listed to learners.
- **The library's default alt text** is plain text (English prefill). Attachments carry their own localised alt text.
- **`content:check`** (per module) reports audio but not images; `content:check -- --all` also reports missing or archived images (2026-10-01). Publishing itself refuses unusable images.
- **Removing an image from the library page** is not offered (unlike audio): it's done in the item's editor, linked from *Used by*.

# CMS: bulk vocabulary import

Status: implemented 2026-09-30. An ADMIN can add up to 5,000 words at once in `/admin/vocabulary/import` (linked as *Import words* from the vocabulary list), from a CSV file or rows pasted from Excel or Google Sheets. Nothing is saved until the data has been previewed and the admin imports it.

## What it builds on
| Existing piece | How the import uses it |
|---|---|
| `vocabularySchema` (via `contentSchemaFor`) | Validates every row. The import adds no rules of its own |
| `vocabularyPayload` and `slugify` (`lib/content/payload.js`, re-exported by the editor's `payload.js`) | Each row fills the word editor's state and becomes exactly the payload the editor would send. An empty slug is made from the lemma, as in the editor |
| `toStorage`, `initialLifecycle` | Imported words are stored as `createContent` stores them: draft, unpublished, version 1, `createdBy` = the admin |
| `PERMISSIONS.contentWrite` | Required for preview and import (the permission for creating a word) |
| `checkSameOrigin`, `readBodyWithLimit`, `enforceRateLimit`, `logger` | CSRF check, body limit, rate limit and audit event, as for curriculum uploads |

## Workflow
1. **Data.** Upload a `.csv` (UTF-8, comma or semicolon separated) or paste into the text box. An uploaded file is loaded into the same box, so it can be corrected in place. *Download CSV template* gives every column with two example rows.
2. **Defaults.** Default level (initially *None: every row needs a level*), source type (initially *Original*, the word editor's default) and source reference. They apply only to rows whose cell is empty.
3. **Preview and check.** The browser parses the data. The server checks every row and every duplicate and writes nothing (`mode=preview`). The table shows each row's spreadsheet row number (the header is row 1), a status (✓ valid, ⚠ warning, ✕ error) and plain-language messages. It shows 200 rows at a time and can be filtered by status.
4. **Fix.** Remove rows (one by one, or all rows with errors or warnings) and restore them from the *Removed* filter, or edit the data and check again. *Download rows with problems* exports them with their messages in import format. Changing the data or the defaults invalidates the check.
5. **Import.** This is enabled only when the current check has no errors. The server runs every check again (`mode=commit`) and imports the rows. The button is disabled while the request runs, and a second click is ignored.
6. **Summary.** Rows in the data, imported, removed (skipped), failed, and imported with a duplicate warning. Failed rows can be downloaded as CSV to fix and import again.

## Format
The column list is `IMPORT_COLUMNS` in `lib/content/vocabularyImport.js`. The template, the column help on the import page and the header matching all come from it.

| Column | Field | Notes |
|---|---|---|
| `lemma` * (or `word`) | `lemma` | Without the article. At most 120 characters |
| `article` | `article` | `der`, `die`, `das` or empty. Required for nouns |
| `plural` | `plural` | With article, e.g. `die Sprachen`. Empty if not applicable |
| `pos` * (or `partOfSpeech`) | `pos` | One of `PARTS_OF_SPEECH`. `proper noun` is read as `proper_noun` |
| `meaning_en` * (or `translation`), `meaning_de`, `meaning_bn` | `meanings` | English required |
| `example_de`, `example_en`, `example_bn` | `example` | German required when a translation is given |
| `notes_en`, `notes_de`, `notes_bn` | `notes` | |
| `level` (or `levelCode`) | `levelCode` | A1–C2. Empty: the default level |
| `topics`, `tags` | `topics`, `tags` | Slugs separated by commas or spaces (at most 10 and 20) |
| `slug` | `slug` | Unique per level. Empty: made from the lemma |
| `sourceType`, `sourceReference` | provenance | Empty: the defaults. A row with its own source type doesn't inherit the default reference |

- Header names are matched ignoring case, spaces, hyphens and underscores. Columns can be in any order.
- An unknown column is an error, so data is never dropped silently. `status`, `image` and `refs` get their own explanation: review state can't be imported, and pictures and reference links are added in the word editor.
- Without a header row (a typical spreadsheet paste), the columns are read in template order: `lemma, article, plural, pos, meaning_en, example_de, example_en, level, …`.
- Case is normalised for the enum columns only (`Noun`, `a1`, `Die`). Text is NFC-normalised and trimmed by the schema.

**Parser** (`lib/content/csv.js`, no dependency):
- RFC 4180 quoted fields with `""` escapes, and commas and line breaks inside quotes.
- LF, CRLF and CR line ends, and a UTF-8 byte order mark.
- Delimiter detection from the first line, outside quotes: tab, otherwise `;` or `,`.
- Rows whose cells are all empty are skipped but keep the numbering.
- An unclosed quote, or text after a closing quote, is reported as an error for that row.
- Uploaded files must be UTF-8 (in Excel: *CSV UTF-8*); other encodings are refused with that hint.
- Exports are UTF-8 with a byte order mark and CRLF line ends, so Excel opens them correctly.

## Validation and duplicates
- The browser only checks structure: size, row count, header, number of cells and cell length. **Every content rule runs on the server**, for the preview and again for the import. The import never relies on an earlier preview.
- Schema issues become sentences, e.g. `Part of speech "thing" is not supported. Use one of: …`, `Level "A7" is not supported…`, `Word (lemma) is too long (at most 120 characters).` Schema messages that are already sentences (`Nouns need an article`) are kept.
- **Errors (block the import):** a row the schema rejects, and a level + slug already used by another row or by an existing word, archived words included (the unique index `{levelCode, slug}`).
- **Warnings (don't block):** the same level, article and lemma (lemma compared ignoring case) as another row or an existing word. The message shows that word's slug and meaning. The CMS allows one word with several meanings (`die Bank`: bench / bank), so the admin decides. Different articles are different words (`der See` / `die See`).
- Two rows whose generated slugs are the same (`der See`, `die See` → `see`) give an error on the second row. Set the `slug` column to fix it.

## Import and failure behaviour
- Any row with an error rejects the whole import before anything is written (`ValidationError`, `fieldErrors` keyed `row.<n>`). The page marks those rows.
- Otherwise the rows are inserted with unordered `insertMany` in chunks of 500 (`vocabularyRepository.insertMany`). Ids are assigned before the write, and after any write error the repository looks up which ids were stored, so the result is exact.
- A slug taken by someone else between the check and the insert (a race on the unique index) fails that row only, and it is reported. The other rows are imported.
- A database error stops the import: rows that weren't stored, and all later rows, are reported as failed.
- No row is reported as imported unless it was stored.
- There is no transaction: none of the code uses them, and the test database (standalone MongoDB) can't run them.

## Limits
The limits are set in one place, `IMPORT_LIMITS` in `lib/content/vocabularyImport.js`: at most 5,000 rows, 3 MB (source text and request body) and 2,000 characters per cell. Inserts go in chunks of 500. The schema's field limits (e.g. 120 characters for a lemma) apply on top.

## Endpoint and security
`POST /api/admin/vocabulary/import?mode=preview|commit`, handled by `app/api/admin/vocabulary/import/route.js` → `lib/http/vocabularyImport.js` → `lib/services/vocabularyImportService.js`. Body: JSON `{ defaults, columns, rows: [[rowNumber, ...cells]] }`.
- It's a route handler, not a Server Action, so this request can have a 3 MB limit without raising the 1 MB limit of every action.
- Checks run in this order:
  1. origin (CSRF, `checkSameOrigin`)
  2. session
  3. `content:write`
  4. rate limit (`vocabularyImportByUser`: 120 previews and imports per admin per hour)
  5. `Content-Type: application/json`
  6. body read with the byte limit
  7. strict request schema (known columns only, unique row numbers)
  8. the service, which checks the permission again
- Duplicate checks use two bounded queries (`findByLevelSlugs`, `findByLemmas`), not one per row.
- **Audit:**
  - every imported word has `createdBy`/`updatedBy` = the admin
  - one `vocabulary_import` log event records `importId`, `actor`, `total`, `imported`, `failed`, `warnings` and `levels`
  - `vocabulary_import_rejected` is logged when rows with errors block an import
  - no word content is logged

## Tests
| File | Covers |
|---|---|
| `tests/unit/vocabulary-import.test.js` (16) | **Parser:** LF/CRLF/CR, quotes, escaped quotes, commas and line breaks inside quotes (row numbers kept), umlauts/ß and BOM, empty optional cells and empty lines, tab/semicolon/comma detection, quotes inside unquoted fields, unclosed quotes and text after a closing quote, CSV round trip. **Columns:** aliases and case, unsupported columns (`status`, `pronunciation`), duplicate columns, no header row, unreadable rows, row and size limits, the template is valid. **Row → payload:** normalisation, defaults, a row's own source, generated and explicit slugs |
| `tests/integration/vocabulary-import.test.js` (16) | **Permissions:** USER and anonymous rejected, also when the route's early check is skipped. **Import:** words stored exactly like words saved through the CMS (body, lifecycle, `createdBy`) and editable afterwards; the preview writes nothing; plain-language errors for 14 kinds of invalid row; one error blocks the whole import; malformed requests. **Duplicates:** within the data (slug error, same-word warning, other level fine, `der See` / `die See`); same word with different meanings imported; existing slug (also archived) is an error and an existing word a warning. **Failures:** the unique-slug race fails only that row; `insertMany` reports exactly what was stored; a database error mid-import. **Scale:** 5,000 rows in one request with one lookup per check and 10 insert chunks. **Route:** success, blocked commit, cross-site, anonymous, non-admin, bad mode, wrong content type, bad JSON, over 3 MB, rate limit |
| `tests/e2e/vocabulary-import.spec.js` (2, desktop) | **Upload:** template download; a CSV with an error and a same-word warning; remove the error row (and find it under *Removed*); import with the progress state and no double submit; summary counts; words in the list as drafts. **Paste:** tab-separated rows without a header; check, then edit (the check is invalidated); a failed import keeps the data; import again; the same rows again are slug errors; export rows with problems |

Results on 2026-09-30:
- `bun run lint`: clean
- `bun run test`: 33 files, 428 tests passed
- `bun run build`: succeeded
- `bun run test:e2e`: 46 passed, 8 skipped (the desktop-only admin tests on the mobile project)

## Known limitations
- **No editing in the preview table.** Fix the source text (or the spreadsheet) and check again.
- **Pictures and reference links** can't be imported. Add them in the word editor.
- **Imports only create words.** Existing words are never updated, and rows whose slug exists are errors.
- **Progress** is an indeterminate progress bar, because the import is a single request.
- **Not atomic across a database failure.** Rows stored before the failure stay imported, and the summary lists exactly which rows failed.
- Imported words are added to lessons in the lesson composer, as before.
