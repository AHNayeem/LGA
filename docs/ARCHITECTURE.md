# Architecture

Status: Phase 1 (foundation) and Phase 2 (learning engine + A1 Module 1) implemented, 2026-09-27. For earlier decisions see `PHASE-0-ARCHITECTURE.md`; where they differ, this file wins. Reference-material findings are in `REFERENCE-ANALYSIS.md`; the curriculum and Module 1 are described in `CURRICULUM-A1.md`.

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
- CSRF protection: Server Actions use Next's built-in Origin/Host check, and the cookie is SameSite=Lax. There are no cookie-authenticated mutating route handlers yet. Any added later must check `Origin`.

## Rate limiting (no Redis)
`lib/security/rateLimit.js` implements fixed windows in the `rateLimits` collection: an atomic `$inc` upsert, a TTL index, and a retry on concurrent first inserts.

| Policy | Limit |
|---|---|
| Login by IP | 30 / 15 min |
| Login by email (hashed) | 8 / 15 min, cleared on success |
| Register by IP | 10 / hour |
| Uploads by user | 60 / hour |
| Learning writes by user (attempts, block completion, flashcard ratings) | 1200 / hour |

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
| `version` | Incremented on every content edit. Used for optimistic concurrency. |

- Editing reviewed or approved content resets it to `draft` and unpublishes it, so changed German text is always re-checked.
- Learners only see documents that are `approved` **and** `published` (`LEARNER_VISIBLE` in `contentRepository.js`).
- New and seeded content is never auto-approved.
- The rules are pure functions in `lib/content/lifecycle.js`, applied by `lib/services/contentService.js`.

Hierarchy: `levels (code) → modules (levelCode, slug) → lessons (moduleId, slug, blocks[])`. Lessons reference reusable content in `vocabulary`, `grammarTopics` and `exercises` (all lifecycle-managed).
- Lessons hold an ordered, bounded list (≤30) of typed `blocks`. Each block has a stable `key`, so progress survives edits and reordering. The block type decides its shape:
  - `intro {body}` and `grammar {refId}` are content blocks
  - `vocabulary {vocabIds[]}` is a word block
  - `reading | listening | speaking | writing | practice | mini_test | mastery_check {refId → exercise}` are exercise blocks
- Mastery rules (`lib/content/mastery.js`) are set per level and overridden per module and lesson. A `null` rule removes an inherited skill.
- **Publish readiness** (`contentService.setPublishStatus`):
  - A lesson can only be published when every exercise, grammar topic and word it uses is published.
  - An exercise can only be published when its required audio has been generated, and only speaking practice may be ungraded.
  - Learner reads fail closed on top of this. If anything in the chain (level → module → lesson → content) is not approved and published, the lesson is unavailable rather than shown partly.
- **Bulk module review** (`bulkModuleTransition`, `/admin/modules/[id]`) applies one step (review / approve / publish) to every item of a module that is in the matching state. It runs through the same per-item functions, so no step can be skipped and dependencies are published first.

**Localisation.** Text fields are `{ de?, en?, bn? }` objects, validated by `localizedText()` and NFC-normalised. Adding a locale means adding its code to `lib/i18n/locales.js`; no schema changes are needed. German is the learning language. English and Bangla are explanation languages, with fallback order requested locale → `en` → any.

**References** (`references` collection). Books, chapters, grammar topics and exam specs are stored as a tree (`parentId`). They hold titles and structural metadata only. Content links to them through `refs: [{ referenceId, note }]`.

## Media and audio
- `mediaAssets` stores `{ kind, mime, storage: { driver, key }, source, visibility, ownerId, voice, language, license, transcript }`. Content refers to media only by asset id, and the UI plays `/api/media/:id`.
- Storage drivers (`lib/storage/*`) share one contract (`put/get/delete/publicUrl`):
  - `static`: read-only files shipped in `public/media/` (pre-generated TTS or recorded curriculum audio). The media route redirects to the CDN URL.
  - `gridfs`: MongoDB Atlas GridFS for learner recordings. It works on Vercel with no disk and no extra infrastructure. This is the default for `MEDIA_STORAGE_DRIVER`.
  - `memory`: tests only.
  - Object storage (S3/R2/Vercel Blob) can be added later as one more driver, with no content changes.
- Uploads are validated by size (`MEDIA_MAX_UPLOAD_BYTES`), by file signature (magic bytes), and by checking the declared MIME type against the detected one (`lib/media/fileTypes.js`).
- Access: `curriculum` assets are readable by any signed-in user. `private` assets are readable by their owner and media managers. Missing and forbidden both return 404, so ids can't be probed.
- Audio playback (`lib/media/audioSource.js`): production uses only pre-generated or recorded assets, with no TTS call per request. Development falls back to browser `speechSynthesis` (de-DE) when no asset exists yet, and the UI labels it as a development preview. The fallback sends the text to the browser, so it is never enabled in production.

### Audio generation (offline)
| Piece | File |
|---|---|
| Cue = what is said, by which logical voice (`female`, `male`, `female2`, `male2`), at which rate. Content stores cues, never files | `lib/audio/cues.js` |
| Provider contract `synthesize(cue) → {bytes, mime, ext, voice}`: `google` (Cloud TTS REST, key sent in a header) and `fake` (silent WAV, tests/E2E only) | `lib/audio/providers/*` |
| Idempotent generator: only missing cues are synthesised | `lib/audio/generate.js` |
| File sink (`public/media/tts/<hash>.<ext>`, static driver) and manifest (`content/audio/manifest.json`) | `lib/audio/fileStore.js` |
| Registration in `mediaAssets` (`ttsHash`, unique) and read-time lookup | `lib/services/audioService.js` |

- **Lookup by hash:** assets are found by the cue hash (sha256 of language, voice, rate and text) at read time. Generating audio therefore never edits content (which would reset its review), and changing a text automatically orphans the old audio.
- **Flow:** `bun run audio:generate` (a developer runs it once, with `TTS_PROVIDER` and `GOOGLE_TTS_API_KEY` in their shell), commit `public/media/tts` and the manifest, deploy, then `bun run seed` registers the assets in each database.
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
| `speak_prompt` | speaking practice with model answer and self-rating (recording is Phase 3) | ungraded, never counts for mastery |

Grading happens only in the service (`learningService.submitExerciseAttempt`). Missing or malformed answers count as wrong, never as errors, and only answers for known item ids are stored. Listening limits (`maxPlays`, `itemAudioMaxPlays`) are enforced in the browser: they are a practice rule, not a security boundary. Shuffling hides the answer order from casual inspection but isn't secret. Exam mode (Phase 5) must not rely on it.

### Attempts, progress, mastery, vocabulary
These are kept apart on purpose:

| Concept | Where | Rule |
|---|---|---|
| Exercise correctness | `attempts` (one immutable doc per submission, with `exerciseVersion`) | per item and total |
| Lesson completion | `userProgress` (one doc per user and lesson, bounded by its blocks) | intro/grammar read; vocabulary: every card rated (verified on the server); exercise: an attempt reached `passThreshold` (best attempt, never lost) |
| Module progress | computed on read | blocks done / total, lessons completed |
| Skill mastery | computed on read (`lib/learning/progress.js`) | **latest** attempt per graded exercise ÷ all available points (unattempted = 0) vs. thresholds resolved level → module → lesson. Skills with no graded content are "not assessed" |
| Vocabulary review | `userVocabulary` (one doc per user and word) | Leitner boxes 1–5 (10 min, 1, 3, 7, 21 days). Self-rated, so it never feeds mastery |

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
| mediaAssets | `{storage.driver, storage.key}` unique, `{ownerId, createdAt}`, `ttsHash` unique (partial) |
| vocabulary | `{levelCode, slug}` unique, `{levelCode, publishStatus}` |
| grammarTopics | `{levelCode, slug}` unique |
| exercises | `{levelCode, slug}` unique, `{levelCode, skill, publishStatus}` |
| attempts | `{userId, exerciseId, createdAt}`, `{userId, createdAt}` |
| userProgress | `{userId, scope, scopeId}` unique, `{userId, moduleId}` |
| userVocabulary | `{userId, vocabId}` unique, `{userId, dueAt}` |
| media.files / media.chunks | GridFS (managed by the driver) |

Later collections (`exams`, `examAttempts`) are added to `lib/db/collections.js` and `indexes.js` when they are first used.

## Operations
```
bun install
cp .env.example .env.local      # set MONGODB_URI (Atlas)
bun run db:indexes              # idempotent; run on each deploy
bun run seed                    # levels, references, curriculum modules (all draft) + audio registration
bun run seed -- --update        # also apply changed seed content (changed items go back to draft)
bun run audio:generate -- --dry-run   # list audio that still needs generating (needs TTS_PROVIDER to generate)
ADMIN_EMAIL=… ADMIN_PASSWORD=… bun run create-admin
bun run dev
```
On Vercel, set `MONGODB_URI`, `MONGODB_DB` and `APP_URL`, and allow Vercel's egress in the Atlas network access list.
