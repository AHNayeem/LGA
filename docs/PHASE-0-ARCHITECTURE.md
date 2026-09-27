# Phase 0 — Audit & Proposed Architecture

Status: **Awaiting approval** (2026-09-27). No application code has been changed yet.

---

## 1. Audit of the existing project

| Area | Finding |
|---|---|
| Framework | Next.js **16.3.6** (App Router), React 19.2.8, JavaScript, `@/*` path alias |
| Styling | Tailwind CSS **v4** via `@tailwindcss/postcss` (CSS-first config in `app/globals.css`, no `tailwind.config.js`) |
| Routes | Only `app/layout.js` and `app/page.js`, both create-next-app boilerplate |
| Database | None |
| Auth | None |
| Env config | No `.env*` files (`.env*` is gitignored, which is correct) |
| Design system | None; Geist font and the default template only |
| Lint | ESLint 9 flat config with `eslint-config-next/core-web-vitals` |
| Tests | None |
| Package manager | `bun.lock` present and `package-lock.json` deleted, so the project uses **bun** |
| Docs | Stub README. `AGENTS.md` warns about breaking Next 16 changes |
| Goethe model exam PDF | **Not present** in the repo |

**Next 16 changes that affect this design** (checked against `node_modules/next/dist/docs`):
- `middleware.js` is **deprecated and renamed to `proxy.js`**. Its export is also `proxy`.
- `cookies()` and `headers()` are async.
- The official auth guide recommends a server-only session module plus a Data Access Layer (DAL). The proxy should only do optimistic checks. The real authorization happens in the DAL.

**Reusable:** the toolchain (Next, Tailwind v4, ESLint) and `jsconfig` alias. The boilerplate page and the Vercel assets can be deleted.

**Problems blocking production:** there is nothing to fix, only things to add: DB, auth, validation, tests, content, layout.

---

## 2. Proposed architecture

```
app/                      UI routes (Server Components by default)
  (marketing)/            landing, about, legal
  (auth)/                 login, register
  (learn)/                dashboard, levels/[level], modules/[slug], lessons/[slug], review, exams
  admin/                  CMS (role-gated in layout + every action)
  api/                    route handlers only where needed (media streaming, audio upload, health)
components/               UI primitives + learning widgets (AudioPlayer, QuestionRenderer, Flashcard…)
lib/
  db/                     Mongo client singleton, collection accessors, index definitions
  auth/                   session.js (server-only), password.js, dal.js (verifySession, requireAdmin)
  validation/             zod schemas (shared by server actions + admin forms)
  services/               domain logic: curriculum, exercises, grading, progress, mastery, srs, exams, media
  ai/                     provider interface only (noop default); no provider hardwired
  storage/                MediaStorage interface + local-disk driver
  security/               rate limiter (Mongo TTL), CSRF/origin check helpers, sanitization
content/a1/               source-of-truth seed JSON for original A1 content (reviewed, versioned in git)
scripts/                  seed, create-admin, ensure-indexes
proxy.js                  optimistic redirect for unauthenticated /learn, /admin
tests/                    unit, integration, e2e
```

Layers: **UI → Server Actions / route handlers → services → db**. Components never import `lib/db`. Every mutating entry point validates input with zod and calls `requireUser()` or `requireAdmin()` from the DAL.

### Dependencies to add (minimal)
| Package | Why |
|---|---|
| `mongodb` | Official driver. Chosen over Mongoose: schemas live in zod, which we need for input validation anyway, so we avoid maintaining two schema systems |
| `zod` | Server-side validation |
| `bcryptjs` | Password hashing (pure JS, no native build issues on Windows or serverless) |
| `server-only` | Stops server modules from leaking into client bundles |
| dev: `vitest`, `mongodb-memory-server`, `@playwright/test` | Unit, integration and E2E tests |

Not added: TypeScript, Redis, Docker, Mongoose, NextAuth, state libraries, S3/MinIO.

### Auth & security
- **Database sessions.** A random 32-byte token goes in an `httpOnly; Secure; SameSite=Lax` cookie, and only its SHA-256 hash is stored in `sessions`, with a TTL index. This supports revocation, logout-everywhere and role changes taking effect immediately.
- Roles `USER` and `ADMIN`. The first admin is created via `scripts/create-admin.js`, never through self-registration.
- Server Actions get Next's built-in origin check. Custom route handlers that mutate verify `Origin`.
- Login and register are rate limited by IP and email, with counters kept in a Mongo `rateLimits` collection (TTL index, no Redis).
- There is no raw HTML rendering of user content. Admin rich text is stored as structured blocks or markdown and rendered with an allowlist.
- Uploads are checked for MIME type and magic bytes, with size caps. Media is served via a route handler that checks publish status and auth.

### Media abstraction
The `mediaAssets` collection stores `{ kind: audio|image, storage: {driver, key}, mime, durationSec, source: tts|native|licensed, voice, license, transcriptRef }`. Content references `mediaId`, never file paths. The `local` driver writes outside `public/`. An S3-style driver can be added later without changing any content.

---

## 3. Proposed MongoDB model

The spec's 17 candidate collections are consolidated where the access patterns are the same.

**Content**
| Collection | Key fields | Notes |
|---|---|---|
| `levels` | `code (A1…C2)`, `title{}`, `order`, `status`, `mastery` | All 6 levels exist as rows, but only A1 is `published` (the others show as "coming soon", with no fake content) |
| `modules` | `levelCode`, `slug`, `order`, `title{}`, `status`, `mastery?`, `refs[]`, `tags[]` | `mastery` overrides the level default |
| `lessons` | `moduleId`, `slug`, `order`, `status`, `blocks[]`, `mastery?`, `refs[]` | `blocks` is an ordered, bounded list (~5–15): `{type: intro|vocab|grammar|exercise|test, refId}`, so lessons can skip skills |
| `vocabulary` | `lemma`, `article`, `plural`, `pos`, `meanings{en,bn}`, `ipa`, `audioId`, `examples[]`, `levelCode`, `topics[]`, `related[]`, `difficulty`, `status`, `review` | For nouns, the display form is always `article + lemma` |
| `grammarTopics` | `slug`, `levelCode`, `explanation{en,bn}` (structured blocks), `examples[]`, `exerciseIds[]`, `refs[]` | |
| `exercises` | `skill (reading/listening/speaking/writing/vocab/grammar)`, `type`, `levelCode`, `stimulus` (text / mediaId / transcript / speakers), `questions[]` (embedded, bounded ≤ ~30), `settings` (transcriptPolicy, maxPlays), `difficulty`, `status`, `review` | One polymorphic collection replaces the 4 skill collections and `questions`. Answer keys are never sent to the client before submission |
| `exams` | `kind (mock/final)`, `levelCode`, `sections[] {skill, timeLimitSec, exerciseIds[], maxPoints}`, `passRule`, `status` | |
| `mediaAssets` | see §2 | |
| `references` | `kind (book/chapter/topic)`, `parentId`, `title`, `publisher`, `notes` | Metadata only, never book content. Content links to it via `refs: [{referenceId, note}]` |

**Learner** (unbounded, so kept as separate per-user docs)
| Collection | Key fields | Index |
|---|---|---|
| `users` | `email` (unique, lowercased), `passwordHash`, `role`, `name`, `uiLanguage` | `email` unique |
| `sessions` | `tokenHash`, `userId`, `expiresAt` | TTL on `expiresAt` |
| `attempts` | `userId`, `exerciseId`, `lessonId`, `skill`, `answers`, `score`, `maxScore`, `submission` (writing text / speaking `mediaId`), `feedback[]` (human/AI/auto) | `{userId, exerciseId, createdAt}` |
| `userProgress` | `userId`, `scope (lesson/module/level)`, `scopeId`, `skillScores{}`, `completedAt`, `masteredAt` | unique `{userId, scope, scopeId}` |
| `userVocabulary` | `userId`, `vocabId`, SRS state (`ease`, `interval`, `due`, `reps`, `lapses`) | `{userId, due}` |
| `examAttempts` | `userId`, `examId`, `status (in_progress/submitted)`, `startedAt`, `deadline`, `sectionAnswers`, `result{}`, `idempotencyKey` | unique partial `{userId, examId}` where `in_progress`, which stops duplicate open attempts |
| `rateLimits` | `key`, `count`, `expiresAt` | TTL |

**Mastery.** Rules are resolved from lesson, then module, then level, e.g. `{ vocab: 0.8, grammar: 0.75, listening: 0.7, reading: 0.7, speaking: {min:0.6, required:false}, writing: {...} }`. Progress is computed only from graded attempts, never from page visits.

**Content workflow.** `status: draft|published|archived` controls visibility. A separate `review: {state: unreviewed|needs_review|approved, notes}` flags German content that needs a native-speaker check.

---

## 4. Proposed A1 curriculum (original content; Goethe A1 / CEFR-aligned)

| # | Module | Communicative goals | Grammar focus |
|---|---|---|---|
| 1 | Hallo! | greet, say goodbye, introduce yourself, spell your name | personal pronouns, `sein`, `heißen`, W-Fragen |
| 2 | Woher kommst du? | origin, residence, languages, numbers 0–20 | regular verbs present tense, verb position 2, Ja/Nein-Fragen |
| 3 | Meine Familie | family, age, numbers to 100, marital status | `haben`, possessives `mein/dein/Ihr`, plural intro |
| 4 | Dinge & Orte | objects, places in town | articles `der/die/das`, `ein/kein`, negation `nicht/kein` |
| 5 | Essen & Trinken | order, likes, meals | Akkusativ (indefinite), `möchte`, `gern` |
| 6 | Einkaufen | prices, quantities, numbers to 1000 | Akkusativ (definite), plural, `Wie viel…?` |
| 7 | Tag für Tag | time, daily routine, weekdays | separable verbs, `um/am`, time expressions |
| 8 | Freizeit | hobbies, abilities, invitations | `können`, `wollen`, word order with time |
| 9 | Termine | appointments, dates, months, forms | `müssen`, ordinal numbers, `Imperativ (Sie)` |
| 10 | Wohnen | apartment, rooms, furniture, ads | predicative adjectives, `Wo?` + fixed Dativ chunks |
| 11 | Arbeit, Schule & Gesundheit | jobs, school, body, at the doctor | `Perfekt` (intro, high-frequency verbs), `war/hatte` |
| 12 | Unterwegs | transport, directions, travel | `Imperativ (du)`, `mit dem/der` chunks, `Wo/Wohin` |
| — | Review + 2 Mock Exams + A1 Final Assessment | | |

Each module ends with a mini test and a mastery check. Listening difficulty rises over the level: slow single speaker (M1–3), then natural two-person dialogue (M4–8), then multi-speaker, real-life announcements and phone messages (M9–12).

**Reference mapping.** Netzwerk neu A1 chapters and Grammatik aktiv topics will be stored as `references` metadata and linked per module or grammar topic. The exact chapter titles must be **confirmed by someone who has the books**, so that no chapter names are guessed. The mapping stays editable in the admin panel.

**Goethe A1 structure (Start Deutsch 1, from public Goethe info; to be verified against the model PDF once it is provided):** Hören (~20 min, 3 parts), Lesen (~25 min, 3 parts), Schreiben (~20 min: form + short message), Sprechen (~15 min, group: self-introduction, ask/answer on topic cards, requests). All practice exams are original and labelled "Goethe-aligned practice", never "official" or "pass guaranteed".

---

## 5. Implementation phases (adjusted)

| Phase | Scope | Exit criteria |
|---|---|---|
| **1 Foundation** | env config, Mongo client + indexes, auth (register/login/logout/sessions), roles, DAL, proxy, rate limiting, base layouts (public / learner / admin), design tokens, level/module/lesson model + seed | Tests show a USER is blocked from admin routes and actions; lint and build pass |
| **2 Content engine: vertical slice** | lesson player, vocab block + flashcards, grammar block, reading and listening exercises (transcript gated), grading service, attempts, progress + mastery, SRS review. **Module 1 is fully authored** to validate the pipeline | A learner can complete Module 1 end to end, with progress based on real scores |
| **2b A1 content** | Modules 2–12 authored in `content/a1/*.json`, each flagged `needs_review` until checked | |
| **3 Speaking + writing** | browser recording (MediaRecorder) → upload → `attempts`; writing submissions; self-assessment checklists; AI feedback interface (noop provider) | |
| **4 Mock exams** | timed exam engine, sections, server-authoritative deadline, idempotent submit, review screen | |
| **5 Final assessment** | exam mode (no hints/transcripts), section breakdown, weak-area recommendations from attempt data | |
| **6 Admin CMS** | CRUD + draft/publish/archive, ordering, media upload, references, paginated lists | "Admin creates → publishes → user sees" E2E test passes |
| **7 Hardening** | a11y audit, CSP headers, error/loading/empty states, perf, full E2E suite, production checklist | |

---

## 6. Risks & open questions (need decisions)

1. **Audio / TTS source.** Listening is the top priority, but there is no audio. Options: (a) pre-generate de-DE audio with a cloud TTS (Google/Azure/ElevenLabs; needs an API key and a check of the license terms), (b) browser `speechSynthesis` as a fallback (voice quality varies by device), (c) record native speakers later. Recommendation: (a) for seed content, run via an offline script and stored as `mediaAssets` with `source: tts`, and (b) as a dev fallback.
2. **Explanation languages.** English only for now, or English + Bangla? The model supports both either way.
3. **Hosting target.** Vercel/serverless has no persistent disk, so the local media driver and uploaded learner recordings won't survive redeploys there. A VPS/Node host works as designed. This decides whether we need an object-storage driver sooner.
4. **Goethe model exam PDF** is not in the repo. Exam timing and scoring above are from public info until it is provided.
5. **German content review.** Who approves the German content? Everything generated will start as `needs_review`.
6. **Book mapping.** Someone needs to provide Netzwerk neu A1 and Grammatik aktiv chapter and topic lists.
7. **MongoDB.** Atlas or local? A `MONGODB_URI` is needed for Phase 1.
