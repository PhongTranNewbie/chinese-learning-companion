# Chinese Learning Companion

A focused Mandarin vocabulary study app with vocabulary management, level organization, spaced repetition reviews, review history, and a database-backed learning dashboard.

The current MVP is ready for a portfolio deployment with a hosted PostgreSQL database. It does not include auth, quiz mode, or AI features yet.

## Features

- Create, edit, search, filter, and archive vocabulary items.
- Organize vocabulary by seeded HSK level labels.
- Automatically create one review card for each vocabulary item.
- Review due cards with `AGAIN`, `HARD`, `GOOD`, and `EASY` grades.
- Persist review history with `ReviewEvent` records.
- Show a dashboard with active vocabulary, due reviews, reviews completed today, archived count, recent review activity, upcoming reviews, and level breakdown.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- Docker Compose
- Vitest

## Local Setup

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

The local database is published on host port `5433` to avoid collisions with other PostgreSQL services.

Run migrations and seed safe level labels:

```powershell
npx prisma migrate dev
npm run db:seed
```

Run the development server:

```powershell
npm run dev
```

Open:

- Dashboard: `http://localhost:3000`
- Vocabulary: `http://localhost:3000/vocabulary`
- Review: `http://localhost:3000/review`

## Verification Commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
git diff --check
```

## Production Deployment Notes

Recommended portfolio deployment shape:

- Host the Next.js app on a platform that supports Next.js App Router.
- Use a hosted PostgreSQL database.
- Set `DATABASE_URL` in the hosting provider's environment variables.
- Do not commit real production database URLs or secrets.
- Run Prisma migrations with `npm run db:deploy` during release or from a trusted deployment shell.
- Seed only safe level labels with `npm run db:seed` if the production database starts empty.

Useful production commands:

```powershell
npm run db:generate
npm run db:deploy
npm run build
```

Production environment variables:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

The Docker Compose database on port `5433` is for local development only.

## Demo Flow

1. Open the dashboard.
2. Add a vocabulary item.
3. Confirm it appears in the active vocabulary list.
4. Open the detail page and inspect its review card.
5. Review a due card.
6. Return to the dashboard and confirm recent review activity updates.
7. Archive a vocabulary item and confirm it no longer appears in active review flows.

See [docs/manual-smoke-test.md](docs/manual-smoke-test.md) for a fuller smoke test checklist.

## Not Implemented Yet

- Authentication.
- Quiz mode.
- AI-generated examples or mnemonics.
