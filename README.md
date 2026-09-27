# LGA – German Learning & Goethe A1 Preparation

A structured German learning platform (A1 first, architecture ready for A2–C2), built with Next.js 16, JavaScript, Tailwind CSS and MongoDB Atlas.

## Getting started

Requires [Bun](https://bun.sh) and a MongoDB Atlas connection string. No local MongoDB installation is needed.

```bash
bun install
cp .env.example .env.local        # fill in MONGODB_URI
bun run db:indexes
bun run seed                      # level structure + reference metadata (all draft)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='at-least-10-chars' bun run create-admin
bun run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` / `build` / `start` | Next.js |
| `bun run lint` | ESLint |
| `bun run test` | Unit + integration tests (in-memory MongoDB, no Atlas needed) |
| `bun run test:e2e` | Playwright E2E. Run `bun run build` first; uses an isolated in-memory DB |
| `bun run db:indexes` | Create/update MongoDB indexes (idempotent) |
| `bun run seed` | Insert missing levels and reference metadata (never overwrites) |
| `bun run create-admin` | Create an admin or promote an existing user (`--reset-password` to replace the password) |

The first E2E run needs the browser: `bunx playwright install chromium`.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers, auth, content lifecycle, media, security
- [docs/REFERENCE-ANALYSIS.md](docs/REFERENCE-ANALYSIS.md): Goethe A1 exam structure and curriculum mapping
- [docs/PHASE-0-ARCHITECTURE.md](docs/PHASE-0-ARCHITECTURE.md): original audit and proposal

Reference PDFs in `docs/` are copyrighted and for local reference only. New PDFs are gitignored; the existing ones are still tracked from commit `e065d05`.
