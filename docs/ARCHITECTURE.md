# Architecture

Status: Phase 1 (foundation), Phase 2 (learning engine + A1 Module 1) and Phase 3 (speaking recordings, audio production tooling, Atlas validation tooling) implemented, 2026-09-27. CMS Phase 1 (admin authoring of levels, modules, lessons, vocabulary, grammar and exercises) and CMS Phase 2 (curriculum media: recorded audio attached to listening exercises, TTS fallback) implemented 2026-09-29, see `CMS.md`. The full A1 curriculum (12 modules) and the exam engine were added 2026-09-29, see `CURRICULUM-A1.md` and `EXAMS.md`. For earlier decisions see `PHASE-0-ARCHITECTURE.md`; where they differ, this file wins. Reference-material findings are in `REFERENCE-ANALYSIS.md`; the curriculum and Module 1 are described in `CURRICULUM-A1.md`.

## Stack
Next.js 16 (App Router), React 19, JavaScript, Tailwind CSS v4, Bun, MongoDB Atlas (native driver), Zod, bcryptjs, server-only. Tests use Vitest with mongodb-memory-server, and Playwright.
Not used: TypeScript, Mongoose, Redis, Docker, NextAuth, or a separate backend.

## Layers

```
app/ (pages, layouts)          UI only; Server Components by default
components/                    presentational + client interactivity
app/actions/*  ("use server")  thin adapters: read form → requireUser() → service → result
app/api/*/route.js             only where HTTP semantics are needed (media streaming, health)
lib/services/*                 business logic; receives the acting user and enforces permissions
lib/repositories/*             all MongoDB queries; filters built from validated values only
lib/db/*                       client singleton, collection names, index definitions
```

Rules:
- Pages and components never import `lib/db` or repositories. They call services, which return serialised plain objects via `lib/db/serialize.js`.
- **Authorisation is enforced in services** (`hasPermission(actor, …)`), and again at the page level by the DAL. This makes every entry point safe: Server Action, route handler, or script.
- `proxy.js` only checks whether a session cookie exists, to redirect early. It never trusts the cookie and never touches the database.

## Authentication
| Piece | File |
|---|---|
| Token generation (32 random bytes, base64url) and SHA-256 hashing | `lib/auth/tokens.js` |
| Password hashing (bcryptjs cost 12; 72-byte cap validated) | `lib/auth/password.js` |
| Cookie read/write (`__Host-lga_session` in production, HttpOnly, Secure, SameSite=Lax) | `lib/auth/session.js`, `lib/auth/cookie.js` |
| Register / login / resolve / logout (framework-agnostic) | `lib/services/authService.js` |
| DAL: `getCurrentUser` (per-request cache), `requireUser`, `requireAdmin`, `requirePermission`, and page variants that redirect | `lib/auth/dal.js` |
| Roles and permissions | `lib/auth/roles.js` |

- Only the SHA-256 hash of the session token is stored, in `sessions`, which has a TTL index on `expiresAt`. Expired sessions are also rejected at query time.
- The user's role is re-read from `users` on every request, so demotion takes effect immediately. Role changes via `changeUserRole` also revoke that user's sessions.
- Sessions have a fixed lifetime (`SESSION_TTL_DAYS`, default 14). There is no sliding renewal yet.
- Self-registration always creates a `USER`. Admins are created with `bun run create-admin`.
- Login errors are generic, and unknown emails still run a dummy bcrypt compare, so timing does not reveal whether an account exists.
- CSRF protection: Server Actions use Next's built-in Origin/Host check, and the cookie is SameSite=Lax. The one cookie-authenticated mutating route handler, `POST /api/recordings`, checks the request with `lib/security/origin.js`: `Origin` is required and must equal `APP_URL` or the addressed host, and `Sec-Fetch-Site` (when sent) must be `same-origin`. Any new mutating route handler must use the same check.

## Rate limiting (no Redis)
`lib/security/rateLimit.js` implements fixed windows in the `rateLimits` collection: an atomic `$inc` upsert, a TTL index, and a retry on concurrent first inserts.

| Policy | Limit |
|---|---|
| Login by IP | 30 / 15 min |
| Login by email (hashed) | 8 / 15 min, cleared on success |
| Register by IP | 10 / hour |
| Uploads by user (`POST /api/recordings`) | 60 / hour, checked before the body is read |
| Learning writes by user (attempts, block completion, flashcard ratings, recording deletion, exam start and submit) | 1200 / hour |

The client IP comes from `x-forwarded-for`, which Vercel sets itself. If the app is ever self-hosted behind a different proxy, that proxy must overwrite this header.

## Content model and lifecycle
Every content document carries two independent axes plus provenance:

| Field | Values / meaning |
|---|---|
| `reviewStatus` | `draft → reviewed → approved`. Any state can go back to `draft`. No skipping. |
| `publishStatus` | `unpublished \| published \| archived`. Only `approved` content can be `published`. |
| `sourceType` | `original \| ai_generated \| licensed \| reference_metadata \| system` |
| `sourceReference` | Free text. Required for `licensed`. |
| `reviewedBy/At`, `approvedBy/At`, `publishedAt` | Audit trail |
| `approvalBasis` | `human_review` (every approval made in `/admin`) or `test_fixture` (see below). Cleared whenever the item goes back to draft |
| `version` | Incremented on every content edit. Used for optimistic concurrency. |

- Editing reviewed or approved content resets it to `draft` and unpublishes it, so changed German text is always re-checked.
- Learners only see documents that are `approved` **and** `published` (`LEARNER_VISIBLE` in `contentRepository.js`).
- New and seeded content is never auto-approved.
- The rules are pure functions in `lib/content/lifecycle.js`, applied by `lib/services/contentService.js`.

Hierarchy: `levels (code) → modules (levelCode, slug) → lessons (moduleId, slug, blocks[])`. Lessons reference reusable content in `vocabulary`, `grammarTopics` and `exercises` (all lifecycle-managed). `exams (levelCode, slug, sections[].exerciseIds)` are lifecycle-managed too and reference exercises the same way (see `EXAMS.md`).
- Lessons hold an ordered, bounded list (≤30) of typed `blocks`. Each block has a stable `key`, so progress survives edits and reordering. The block type decides its shape:
  - `intro {body}` and `grammar {refId}` are content blocks
  - `vocabulary {vocabIds[]}` is a word block
  - `reading | listening | speaking | writing | practice | mini_test | mastery_check {refId → exercise}` are exercise blocks
- Mastery rules (`lib/content/mastery.js`) are set per level and overridden per module and lesson. A `null` rule removes an inherited skill.
- **Publish readiness** (`contentService.setPublishStatus`):
  - A lesson can only be published when every exercise, grammar topic and word it uses is published.
  - An exercise can only be published when its required audio has been generated, and only speaking practice may be ungraded.
  - Learner reads fail closed on top of this. If anything in the chain (level → module → lesson → content) is not approved and published, the lesson is unavailable rather than shown partly.
- **Test-fixture approvals.** To validate a module end to end on a dev/test database before a person has reviewed it, `bun run content:fixture-publish` (and the E2E seeding) approve with `approvalBasis: "test_fixture"`. This is **not** a content review: `/admin` shows "Test-fixture approval – not a genuine review" next to each such item, `content:check` warns about them, provenance stays `ai_generated`, and the script refuses to run with `NODE_ENV=production` or on a database whose name doesn't mark it as dev/test (`lib/config/databaseGuard.js`). Content released to real learners needs genuine human approvals.
- **Learner disclosure.** Lessons and modules with any `ai_generated` content show "AI-assisted content, not yet reviewed by a native speaker." (`components/learn/AiContentNotice.js`). An in-app approval doesn't remove the notice, because it isn't a native-speaker review.
- **Pre-publish report:** `bun run content:check -- --module a1/hallo` lists missing required audio per lesson (including the module test), published items depending on unpublished ones, lifecycle inconsistencies, provenance changes, approval basis and unreviewed Bangla. It is read-only and exits 1 on errors.
- **Admin authoring (CMS Phase 1, `CMS.md`).** `/admin` edits every content type through `contentService.saveContent` → `createContent`/`updateContent`, so the schemas, permissions, version checks and edit rule above apply unchanged. Writes also check relationships: a lesson's module and its block references (right collection, no word twice per block) must exist, and a level's code is immutable. Optional fields removed in an editor are cleared (`null`). Archiving (`publishStatus: archived`) is the soft delete.
- **Bulk module review** (`bulkModuleTransition`, `/admin/modules/[id]`) applies one step (review / approve / publish) to every item of a module that is in the matching state. It runs through the same per-item functions, so no step can be skipped and dependencies are published first.

**Localisation.** Text fields are `{ de?, en?, bn? }` objects, validated by `localizedText()` and NFC-normalised. Adding a locale means adding its code to `lib/i18n/locales.js`; no schema changes are needed. German is the learning language. English and Bangla are explanation languages, with fallback order requested locale → `en` → any.

**References** (`references` collection). Books, chapters, grammar topics and exam specs are stored as a tree (`parentId`). They hold titles and structural metadata only. Content links to them through `refs: [{ referenceId, note }]`.

## Media and audio
- `mediaAssets` stores `{ kind, mime, storage: { driver, key }, source, visibility, ownerId, voice, language, license, transcript }`. Content refers to media only by asset id, and the UI plays `/api/media/:id`.
- Three kinds of audio share the collection and never mix:
  - learner recordings: `source: learner`, `private`, `ownerId` and a `recording` subdocument
  - generated TTS: `source: tts`, `curriculum`, `ttsHash`
  - curriculum uploads (CMS Phase 2): `source: native | licensed`, `visibility: linked`, `status: active | archived`, `title`, `originalName`. Uploaded in `/admin/media` and attached to listening exercises by id (`stimulus.audio.mediaId`, `items[].audio.mediaId`)
- Storage drivers (`lib/storage/*`) share one contract (`put/get/delete/publicUrl`):
  - `static`: read-only files shipped in `public/media/` (pre-generated TTS or recorded curriculum audio). The media route redirects to the CDN URL.
  - `gridfs`: MongoDB Atlas GridFS for learner recordings and admin-uploaded curriculum audio. It works on Vercel with no disk and no extra infrastructure. This is the default for `MEDIA_STORAGE_DRIVER`.
  - `memory`: tests only.
  - Object storage (S3/R2/Vercel Blob) can be added later as one more driver, with no content changes.
- Uploads are validated by size, by file signature (magic bytes), and by checking the declared MIME type against the detected one (`lib/media/fileTypes.js`):
  - learner recordings (`MEDIA_MAX_UPLOAD_BYTES`) accept only the containers `MediaRecorder` produces: WebM, MP4 and Ogg
  - curriculum uploads (`CURRICULUM_MEDIA_MAX_BYTES`, 4 MB) accept MP3, M4A/MP4, Ogg, WAV and WebM. The file name's extension must also match, and MP3s must parse frame by frame
  - curriculum images (`CURRICULUM_IMAGE_MAX_BYTES`, 2 MB) accept PNG, JPEG, WebP and GIF, never SVG. The extension must match, the header must parse, and the image may be at most 8000 px per side and 40 megapixels (`lib/media/imageInfo.js`). See [CMS.md](CMS.md#cms-phase-5-curriculum-images)
- Clients only ever see `publicMediaView(asset)` = `{ id, kind, mime, size, durationSec, createdAt }`. Storage driver, key, GridFS ids and owner never leave the server.
- Access (`canReadMedia`):
  - `curriculum` assets are readable by any signed-in user
  - `private` assets by their owner and media managers
  - `linked` assets by media managers, and by learners only while approved, published content (an exercise, word or lesson) attaches them and they are active
  - missing and forbidden both return 404, so ids can't be probed
- Resolution order for listening audio (`audioService`): an attached active recording, then generated TTS by cue hash, then (development only) the browser voice, otherwise unavailable. Publishing requires one of the first two for every listening target (`missingRequiredAudio`). See `CMS.md`, Phase 2.
- Audio playback (`lib/media/audioSource.js`): production uses only pre-generated or recorded assets, with no TTS call per request. Development falls back to browser `speechSynthesis` (de-DE) when no asset exists yet, and the UI labels it as a development preview. The fallback sends the text to the browser, so it is never enabled in production.

### Speaking recordings (Phase 3)

```
browser: record → stop/cancel → preview → record again → Save
  → POST /api/recordings?lessonId&exerciseId&itemId&duration   (raw bytes, Content-Type = recorder type)
      origin check → session → target check (live lesson, speak_prompt item) → rate limit
      → read body with byte limit → signature check → storage.put → mediaAssets insert
      ← 201 { recording: { id, mime, size, durationSec, createdAt } }        status "pending"
  → submitExerciseAction({ answers: { q1: { selfRating, recordingId } } })
      recording must belong to this learner AND this exercise item, or the whole submission fails
      → attempt stored → recording "attached" (attemptId) → older recordings for the item deleted
lesson page: latest attached recording per item → <audio src="/api/media/:id"> (owner only) + delete
```

| Piece | File |
|---|---|
| HTTP handler (framework-free, unit-testable): origin, auth, streaming size limit, error mapping | `lib/http/recordingUpload.js`, `lib/http/readBody.js`, route `app/api/recordings/route.js` |
| Target validation, pending → attached, replacement, deletion, stale cleanup | `lib/services/recordingService.js` (reads: `recordingReads.js`) |
| Bytes + metadata, cleanup when the metadata write fails, public view | `lib/services/mediaService.js` (`storeLearnerRecording`, `destroyMediaAsset`) |
| Shared constants (recorder formats, statuses, stale age) | `lib/media/recording.js` |
| Browser: recorder, upload client, speaking item | `components/audio/VoiceRecorder.js`, `lib/media/recordingClient.js`, `components/exercises/items/SpeakPromptItem.js` |

- **Metadata** lives on the `mediaAssets` document (`source: "learner"`, `visibility: "private"`, `ownerId`) in a `recording` subdocument: `{ lessonId, exerciseId, itemId, status: pending|attached, attemptId, attachedAt, durationSec }`. Nothing is stored on the user document.
- **Answer format.** A `speak_prompt` answer is either the Phase 2 string (`"confident"`), which still works, or `{ selfRating, recordingId? }`. Speaking stays `graded: false` with score 0. It never counts towards mastery, and there is **no automated pronunciation assessment or feedback** of any kind.
- **Order of writes.** Bytes are stored first, then the metadata. If the metadata insert fails, the bytes are deleted again. Deletion removes the metadata first (access is revoked immediately), then the bytes.
- **Replacement and cleanup.**
  - A new upload for an item supersedes that item's unsubmitted uploads.
  - A new submission deletes the item's previously attached recording. Attempts are immutable and keep the old id, which then plays as 404.
  - Unsubmitted uploads older than 24 hours are removed on the learner's next upload, or globally by `bun run media:cleanup`.
- **Isolation.** Every recording query is scoped by `ownerId`. Missing, foreign and forged ids all look the same (404 for playback and deletion, the same validation error for submission).
- **Limits.**
  - 60 s (`RECORDING_MAX_SECONDS`): enforced by the recorder (auto-stop), and the client-reported duration is rejected above the limit plus 2 s.
  - 2 MB (`MEDIA_MAX_UPLOAD_BYTES`): the real server-side bound. Checked from `Content-Length` before reading, and by counting while streaming.
  - The duration is not re-measured on the server (WebM from `MediaRecorder` has no reliable duration header), so the byte limit is the backstop.
- **Degradation.** If the microphone is denied or missing, `MediaRecorder` is absent or no supported format exists, the item explains why and self-rating still works. Upload or network failures keep the take so the learner can retry, or discard it.
- **Deployment limit and extension point.** The current upload goes through a serverless function, which caps request bodies (Vercel: 4.5 MB). 2 MB leaves headroom. Larger files would need a direct-to-storage upload (presigned URL, then a completion call that validates the stored bytes). That would replace `lib/media/recordingClient.js` and the route, but not the lesson UI or the learning service: those only ever handle a `recordingId`.

### Audio generation (offline)
| Piece | File |
|---|---|
| Cue = what is said, by which logical voice (`female`, `male`, `female2`, `male2`), at which rate. Content stores cues, never files | `lib/audio/cues.js` |
| Provider contract `synthesize(cue) → {bytes, mime, ext, voice}`: `google` (Cloud TTS REST, key sent in a header) and `fake` (silent WAV, tests/E2E only) | `lib/audio/providers/*` |
| Idempotent generator: only missing cues are synthesised | `lib/audio/generate.js` |
| File sink (`public/media/tts/<hash>.<ext>`, static driver) and manifest (`content/audio/manifest.json`) | `lib/audio/fileStore.js` |
| Registration in `mediaAssets` (`ttsHash`, unique) and read-time lookup | `lib/services/audioService.js` |

- **Lookup by hash:** assets are found by the cue hash (sha256 of language, voice, rate and text) at read time. Generating audio therefore never edits content (which would reset its review), and changing a text automatically orphans the old audio.
- **Voices** (`lib/audio/providers/google.js`). They were checked against Google's published de-DE list on 2026-09-27:

  | Role | Voice |
  |---|---|
  | female | `de-DE-Neural2-F` |
  | male | `de-DE-Neural2-E` |
  | female2 | `de-DE-Neural2-C` |
  | male2 | `de-DE-Wavenet-E` |

  The earlier defaults `Wavenet-B`/`-D` no longer exist. Chirp3-HD voices are rejected because Google documents that they ignore `speakingRate`. Settings: `audioEncoding: MP3`, `speakingRate` slow = 0.85 and normal = 1.0. Every run calls `voices.list` first and stops if a configured voice is missing, has the wrong gender, or is Chirp3-HD.
- **Flow:**
  1. `bun run audio:smoke`: voice check, plus 20 sample clips through the production pipeline (every voice, both rates, umlauts, spelling, phone numbers, an e-mail address). Samples are validated and written to `.audio-smoke/…/listen` (gitignored) with a `LISTEN.txt` index. **A person listens to them.**
  2. `TTS_PROVIDER=google bun run audio:generate -- --voices-verified`: generates only the missing clips into `public/media/tts/<hash>.mp3`. Invalid MP3 responses are never stored. The manifest records voice, `speakingRate`, duration and the run's `settings`.
  3. `bun run audio:verify` (below).
  4. Commit `public/media/tts` and `content/audio/manifest.json`, deploy, then run `bun run seed` against each database to register the assets.

  `-- --prune` removes clips that no content uses any more.
- **Verification** (`lib/audio/verify.js`, `bun run audio:verify`) fails on any of:
  - a missing clip, or an unexpected (orphan) manifest entry or file
  - a hash that doesn't match its text, voice and rate
  - a file name that isn't `tts/<hash>.mp3`, or a size mismatch
  - an empty file, or one that doesn't parse as MP3 (`lib/audio/mp3.js` walks the frame headers)
  - a clip shorter than 0.2 s or longer than 60 s
  - a clip from the `fake` provider, or a non-static driver or non-MP3 entry
  - any listening exercise or module-test clip that is unavailable

  It warns on byte-identical clips and on durations that look implausible for the text length.
- **Runtime:** Vercel never needs a TTS key.
- **Adding a provider:** one file plus one case in `lib/audio/providers/index.js`.

## Learning engine (Phase 2)

### Exercise engine
`lib/exercises/` is type-agnostic. Each item type is one module in `lib/exercises/types/` implementing:

| Member | Purpose |
|---|---|
| `schema` | authored item, including the answer key |
| `answerSchema` | what a learner may submit |
| `maxScore(item)` | points available |
| `toClient(item)` | payload without the answer key |
| `grade(item, answer)` | `{correct, score, feedback}` |
| `reveal(item)` | expected answer, shown after submitting |

The engine (`engine.js`) builds the learner payload, grades a submission and produces the post-submission reveal. Transcripts stay hidden until then (`transcriptPolicy`). Client renderers live in `components/exercises/items/*`, registered in `components/exercises/renderers.js`. Lessons, attempts, scoring, progress and mastery never look at item types.

| Type | Use | Scoring |
|---|---|---|
| `mcq` | 3-option exam style, situations, question words | 1 |
| `true_false` | richtig/falsch on texts and recordings | 1 |
| `text_input` | gaps, dictation, form filling. Accepted variants; case, space and punctuation tolerant; `ae/oe/ue/ss` accepted with a spelling hint; optional `ignoreSpaces` for phone numbers | 1 |
| `match` | pairs. The right side is shuffled deterministically with neutral ids | 1 per pair |
| `order` | sentence building; alternative correct orders allowed | 1 |
| `speak_prompt` | speaking practice: optional recording (Phase 3), model answer, self-rating | ungraded, never counts for mastery; no pronunciation scoring |

Grading happens only in the service (`learningService.submitExerciseAttempt`). Missing or malformed answers count as wrong, never as errors, and only answers for known item ids are stored. Listening limits (`maxPlays`, `itemAudioMaxPlays`) are enforced in the browser: they are a practice rule, not a security boundary. Shuffling hides the answer order from casual inspection but isn't secret. Exams therefore seed it with a secret per-attempt prefix (`seedPrefix`, see `EXAMS.md`).

### Attempts, progress, mastery, vocabulary
These are kept apart on purpose:

| Concept | Where | Rule |
|---|---|---|
| Exercise correctness | `attempts` (one immutable doc per submission, with `exerciseVersion`) | per item and total |
| Lesson completion | `userProgress` (one doc per user and lesson, bounded by its blocks) | intro/grammar read; vocabulary: every card rated (verified on the server); exercise: an attempt reached `passThreshold` (best attempt, never lost) |
| Module progress | computed on read | blocks done / total, lessons completed |
| Skill mastery | computed on read (`lib/learning/progress.js`) | **latest** attempt per graded exercise ÷ all available points (unattempted = 0) vs. thresholds resolved level → module → lesson. Skills with no graded content are "not assessed" |
| Vocabulary review | `userVocabulary` (one doc per user and word) | Leitner boxes 1–5 (10 min, 1, 3, 7, 21 days). Self-rated, so it never feeds mastery |
| Exam completion | `examAttempts` (one doc per attempt, with a frozen snapshot) | a submitted attempt, graded on the server against the snapshot. Never feeds lesson completion or mastery (`EXAMS.md`) |
| Level completion | not implemented | no product rule defines it yet |

- **Ids only from the client:** the client sends ids and raw answers. Every write re-checks the whole visibility chain, and an exercise must belong to the lesson it is submitted under.
- **Rate limit:** learner writes share a 1200/hour limit per user (`learningByUser`).
- **Thresholds are not Goethe criteria:** the mastery thresholds are the application's learning targets, not official Goethe pass criteria.

### Seeding curriculum
Module definitions in `content/curriculum/**` are pure data that reference their parts by slug. `seedCurriculumModule` resolves the slugs to ids and applies `initialLifecycle`. Everything starts as draft/unpublished with the definition's provenance (`ai_generated` for Module 1). The default mode only inserts missing items. `--update` applies changed items through `editPatch`, which bumps the version and sends the item back to draft and unpublished.

## Errors and logging
- `lib/errors.js` defines typed errors (`ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitError`). Only errors marked `expose` reach the user, and everything else becomes a generic message.
- `runAction()` converts thrown errors into `{ ok, code, message, fieldErrors }` results.
- `lib/logger.js` writes JSON lines to stdout/stderr (collected by Vercel) and redacts passwords, tokens, hashes and the connection string.
- There is a route-level `error.js` plus `not-found.js` and `loading.js`.

## Security headers
Set in `next.config.mjs`:
- `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`
- `Permissions-Policy` with microphone for our own origin only
- HSTS in production
- `X-Powered-By` removed

A Content-Security-Policy is still to do (Phase 7).

## Collections and indexes
| Collection | Indexes |
|---|---|
| users | `email` unique |
| sessions | `tokenHash` unique, `userId`, `expiresAt` TTL |
| rateLimits | `key` unique, `expiresAt` TTL |
| levels | `code` unique, `{publishStatus, order}` |
| modules | `{levelCode, slug}` unique, `{levelCode, publishStatus, order}` |
| lessons | `{moduleId, slug}` unique, `{moduleId, publishStatus, order}` |
| references | `slug` unique, `{parentId, order}` |
| mediaAssets | `{storage.driver, storage.key}` unique, `{ownerId, createdAt}`, `{source, createdAt}` (media library), `ttsHash` unique (partial), `{ownerId, recording.exerciseId, recording.itemId, createdAt}` and `{recording.status, createdAt}` (partial, recordings) |
| vocabulary | `{levelCode, slug}` unique, `{levelCode, publishStatus}` |
| grammarTopics | `{levelCode, slug}` unique |
| exercises | `{levelCode, slug}` unique, `{levelCode, skill, publishStatus}`, `stimulus.audio.mediaId` and `items.audio.mediaId` (partial, attached recordings) |
| attempts | `{userId, exerciseId, createdAt}`, `{userId, createdAt}` |
| userProgress | `{userId, scope, scopeId}` unique, `{userId, moduleId}` |
| userVocabulary | `{userId, vocabId}` unique, `{userId, dueAt}` |
| exams | `{levelCode, slug}` unique, `{levelCode, publishStatus, order}`, `sections.exerciseIds` |
| examAttempts | `{userId, examId}` unique partial (`status: in_progress`), `{userId, examId, startedAt}` |
| media.files / media.chunks | GridFS (managed by the driver) |


## Operations
```
bun install
cp .env.example .env.local      # set MONGODB_URI (Atlas)
bun run db:indexes              # idempotent; run on each deploy
bun run seed                    # levels, references, curriculum modules (all draft) + audio registration
bun run seed -- --update        # also apply changed seed content (changed items go back to draft)
bun run audio:generate -- --dry-run   # list audio that still needs generating
bun run audio:smoke                   # real-API voice check + samples to listen to (needs GOOGLE_TTS_API_KEY)
TTS_PROVIDER=google bun run audio:generate -- --voices-verified
bun run audio:verify                  # manifest/files/content consistency; exits 1 on problems
ADMIN_EMAIL=… ADMIN_PASSWORD=… bun run create-admin
bun run content:check                 # pre-publish report for Module 1
bun run media:cleanup                 # remove stale unsubmitted recordings (safe to schedule)
bun run dev
```
On Vercel, set `MONGODB_URI`, `MONGODB_DB` and `APP_URL`, and allow Vercel's egress in the Atlas network access list. No TTS key is needed at runtime.

## Testing
| Command | What | Database |
|---|---|---|
| `bun run test` | unit + integration (Vitest) | in-memory MongoDB, one database per file |
| `bun run test:e2e` | Playwright, desktop Chrome + Pixel 7, fake microphone | in-memory MongoDB (`scripts/e2e-server.mjs`) |
| `bun run test:atlas` | the integration suite + `tests/atlas/*` (indexes, persistence across a fresh connection, GridFS) | **real Atlas** via `ATLAS_TEST_URI` or `MONGODB_URI`. Throwaway `lga_itest_<run>_<id>` databases, dropped afterwards |
| `bun run test:e2e:atlas` | browser flow, then **application restart**, then login and persisted-state checks (UI and stored documents) | **real Atlas**, throwaway `lga_e2e_<run>`, dropped unless `--keep` |

The Atlas commands fail if no URI is configured, or if it isn't an Atlas host (unless `ATLAS_ALLOW_NON_ATLAS=1`). They never fall back to an in-memory server. Test helpers refuse to use or drop databases not named `test_*`/`lga_itest_*`.
