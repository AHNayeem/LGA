# LGA – German Learning & Goethe A1 Preparation

A structured German learning platform (A1 first, architecture ready for A2–C2), built with Next.js 16, JavaScript, Tailwind CSS and MongoDB Atlas.

## Getting started

Requires [Bun](https://bun.sh) and a MongoDB Atlas connection string. No local MongoDB installation is needed.

```bash
bun install
cp .env.example .env.local        # fill in MONGODB_URI
bun run db:indexes
bun run seed                      # levels, references, A1 modules 1–12 and the practice exam – all draft, nothing published
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='at-least-10-chars' bun run create-admin
bun run dev
```

Open http://localhost:3000. Admins create and edit levels, modules, lessons (block composer), vocabulary, grammar topics and exercises in `/admin` (see [docs/CMS.md](docs/CMS.md)). Learners only see content after an admin reviews, approves and publishes it there (each module has a review page with bulk steps). In development, audio that hasn't been generated plays with the browser voice. In production it shows as unavailable, and listening exercises can't be published until their audio exists: generated TTS, or a recording uploaded in `/admin/media` and attached to the exercise.

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` / `build` / `start` | Next.js |
| `bun run lint` | ESLint |
| `bun run test` | Unit + integration tests (in-memory MongoDB, no Atlas needed) |
| `bun run test:e2e` | Playwright E2E. Run `bun run build` first; uses an isolated in-memory DB |
| `bun run db:indexes` | Create/update MongoDB indexes (idempotent) |
| `bun run seed` | Insert missing levels, references, curriculum and exams (never overwrites); register generated audio. `-- --update` also applies changed content and sends it back to draft |
| `bun run test:atlas` | Integration tests against a **real Atlas** cluster (`ATLAS_TEST_URI` or `MONGODB_URI`); throwaway databases, dropped afterwards |
| `bun run test:e2e:atlas` | Browser flow on **real Atlas** with an app restart in the middle (after `bun run build`) |
| `bun run audio:smoke` | Real-API TTS smoke test: checks voices, writes 20 samples to `.audio-smoke/` for you to listen to |
| `bun run audio:generate` | Offline German TTS for all curriculum audio cues (`-- --dry-run` lists what is missing; `-- --voices-verified` after the smoke test; `-- --prune` removes unused clips). Needs `TTS_PROVIDER` and a provider key in your shell, never on Vercel |
| `bun run audio:verify` | Check generated audio against the content: missing/orphan/corrupt/mismatched clips |
| `bun run create-admin` | Create an admin or promote an existing user (`--reset-password` to replace the password) |
| `bun run content:check` | Read-only pre-publish report for a module (audio, dependencies, lifecycle, provenance) |
| `bun run content:fixture-publish` | Dev/test databases only: publish a module with **test-fixture** approvals (not a content review) |
| `bun run media:cleanup` | Remove speaking recordings that were uploaded but never submitted (older than 24 h) |

The first E2E run needs the browser: `bunx playwright install chromium`.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers, auth, content lifecycle, media, security
- [docs/CMS.md](docs/CMS.md): admin content authoring (CMS Phase 1) and curriculum media/audio (CMS Phase 2): routes, actions, editors, media lifecycle, security, tests, limitations
- [docs/CHANGELOG.md](docs/CHANGELOG.md): what each phase changed
- [docs/REFERENCE-ANALYSIS.md](docs/REFERENCE-ANALYSIS.md): Goethe A1 exam structure and curriculum mapping
- [docs/CURRICULUM-A1.md](docs/CURRICULUM-A1.md): the 12-module plan checked against the references, all 12 modules, reviewer checklist
- [docs/EXAMS.md](docs/EXAMS.md): the exam engine (model, attempts, scoring, review policies, admin, preview, security)
- [docs/PHASE-0-ARCHITECTURE.md](docs/PHASE-0-ARCHITECTURE.md): original audit and proposal

Reference PDFs in `docs/` are copyrighted and for local reference only. New PDFs are gitignored; the existing ones are still tracked from commit `e065d05`.
