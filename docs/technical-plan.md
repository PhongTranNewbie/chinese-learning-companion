# Technical Plan

## Current Status

This was the original implementation plan. The current portfolio MVP implements vocabulary, decks, courses/lessons, small manual CSV import/export, spaced repetition reviews, review history, and dashboard metrics. Quiz mode, authentication, and larger-session pagination are future work.

## Stack

- Framework: Next.js App Router
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Local services: Docker Compose for PostgreSQL
- Styling: Tailwind CSS
- Auth: Optional Auth.js, deferred unless multi-user ownership is required for the first deploy
- Deployment: Vercel for app, Neon or Supabase Postgres for production database

## Architecture Overview

The app should use a conventional full-stack Next.js architecture:

- Server components for data-heavy pages such as dashboard, vocabulary list, and detail pages.
- Server actions or route handlers for mutations such as creating vocabulary, importing/exporting small CSV files, submitting reviews, and managing decks/courses.
- Prisma as the database access layer.
- Domain utilities for review scheduling, CSV parsing, and dashboard metric aggregation.
- Tailwind for UI styling with a compact learning-tool feel.

Suggested source organization once app code begins:

```text
app/
  page.tsx
  vocabulary/
  review/
  quiz/        # future
  levels/
  settings/
components/
  vocabulary/
  review/
  quiz/        # future
  dashboard/
lib/
  db.ts
  review-scheduler.ts
  quiz-generator.ts # future
  dashboard-metrics.ts
  validation.ts
prisma/
  schema.prisma
docker-compose.yml
```

## Core Domain Modules

### Review Scheduler

Owns spaced repetition calculations. It should be deterministic and unit tested.

Inputs:

- Current card state.
- Review grade.
- Current timestamp.

Outputs:

- Updated interval.
- Updated ease factor.
- Updated due date.
- Updated review count.
- Updated lapse count when recall fails.

### Future Quiz Generator

Builds short quiz sessions from selected vocabulary.

Responsibilities:

- Choose eligible vocabulary by level, tag, or review status.
- Generate question prompts.
- Generate plausible answer choices for multiple-choice questions.
- Avoid duplicate choices.
- Keep quiz scoring separate from spaced repetition scheduling.

### Dashboard Metrics

Aggregates learning data for the dashboard.

Metrics:

- Cards due now.
- Cards reviewed today.
- Total vocabulary count.
- New cards this week.
- Review accuracy over time.
- Distribution by level.
- Recently difficult cards.

## Review Scheduling Logic Draft

Use a simplified SM-2-inspired algorithm rather than a complex clone of Anki.

Grades:

- Again: user did not remember.
- Hard: remembered with serious effort.
- Good: remembered correctly.
- Easy: remembered immediately.

Suggested fields:

- `intervalDays`
- `easeFactor`
- `dueAt`
- `reviewCount`
- `lapseCount`
- `lastReviewedAt`

Initial state:

- `intervalDays = 0`
- `easeFactor = 2.5`
- `dueAt = createdAt`
- `reviewCount = 0`
- `lapseCount = 0`

Draft behavior:

```text
Again:
  intervalDays = 0
  easeFactor = max(1.3, easeFactor - 0.2)
  dueAt = now + 10 minutes
  lapseCount += 1

Hard:
  intervalDays = max(1, round(intervalDays * 1.2))
  easeFactor = max(1.3, easeFactor - 0.15)
  dueAt = now + intervalDays

Good:
  if reviewCount == 0: intervalDays = 1
  else if reviewCount == 1: intervalDays = 3
  else: intervalDays = round(intervalDays * easeFactor)
  dueAt = now + intervalDays

Easy:
  if reviewCount == 0: intervalDays = 4
  else: intervalDays = round(intervalDays * easeFactor * 1.3)
  easeFactor = min(3.0, easeFactor + 0.15)
  dueAt = now + intervalDays
```

Implementation notes:

- Store all due dates in UTC.
- Keep scheduling pure and deterministic for testing.
- Persist every review event before or within the same transaction as card state updates.
- Do not let quiz answers update scheduling in the MVP.

## Authentication Strategy

Recommended MVP path:

- Start with a single-user app or local demo user to reduce complexity.
- Design database tables with optional `userId` so Auth.js can be added without rewriting every model.
- Add Auth.js before public production deployment if the app stores real user data.

If Auth.js is included from the start:

- Use per-user ownership for vocabulary, review cards, review events, and quiz sessions.
- Protect all app routes except login.
- Ensure all queries are scoped by authenticated user.

## Database and Prisma

Use PostgreSQL locally through Docker Compose.

Expected local environment:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chinese_learning_companion?schema=public"
```

Prisma responsibilities:

- Schema migrations.
- Type-safe database access.
- Seed script for a small sample deck if licensing is clear or manually authored.

## Portfolio Deployment Plan

Recommended portfolio deployment:

- Vercel for Next.js app.
- Neon or Supabase for managed PostgreSQL.
- Environment variables configured in Vercel.
- Prisma migrations run during deployment or manually before release.

Production checklist:

- Configure `DATABASE_URL`.
- Run migrations against production database.
- Seed only safe level labels or manually authored demo data.
- Verify dashboard, review flow, deck study, courses, CSV import/export, and vocabulary CRUD in the deployed app.
- Add README deployment notes and screenshots.

Do not treat a public deployment as production multi-user software until authentication and per-user query scoping are implemented.

## Testing and Verification Strategy

Unit tests:

- Review scheduler.
- Dashboard metric helpers if isolated.

Integration checks:

- Prisma migration.
- Vocabulary create/update/delete.
- Review submission transaction.

Manual smoke tests:

- Add a vocabulary card.
- Complete a review session.
- Confirm due date changes.
- View review history.
- Confirm dashboard metrics update.

## Risk List

- Scope creep from AI and pronunciation features.
- Incorrect scheduling creates a poor learning loop.
- Review sessions require careful state handling to avoid duplicate submissions.
- Time zone issues can make "due today" confusing.
- Imported HSK lists may have licensing concerns.
- Dashboard queries may become slow if aggregation is not designed carefully.
- Optional auth timing can affect data model decisions.

## Verification Commands by Phase

These commands assume the app has been scaffolded in later phases.

```powershell
npm run lint
npm run typecheck
npm test
docker compose up -d
npx prisma migrate dev
npx prisma studio
npm run build
```

Before code exists, planning verification is:

```powershell
git status --short
git diff --check
```
