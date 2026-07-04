# Chinese Learning Companion

A focused Mandarin vocabulary study app for collecting words, organizing them into decks and lightweight courses, and reviewing them with a database-backed spaced repetition loop.

The current app is a single-user portfolio MVP. It includes vocabulary management, CSV import/export for small manual study lists, review scheduling, review history, deck study mode, courses/lessons, and dashboard metrics. It does not include authentication, per-user ownership, quiz mode, AI features, or large-dataset tooling yet.

## Implemented Features

- Create, edit, search, filter, and archive vocabulary items.
- Store Mandarin-specific fields such as hanzi, pinyin, meaning, level, measure word, examples, notes, and memory aids.
- Automatically create one review card when a vocabulary item is created.
- Review due cards with `AGAIN`, `HARD`, `GOOD`, and `EASY` grades.
- Persist review history with `ReviewEvent` records and update the next due date inside a transaction.
- Organize vocabulary into active decks and study one deck at a time.
- Filter deck study by all active cards or due-only cards.
- Group decks into lightweight courses with ordered lessons.
- Import small manually curated CSV files and export active vocabulary to CSV.
- Show a dashboard with active vocabulary, due reviews, reviews completed today, archived count, recent practice, upcoming reviews, and level breakdown.
- Provide empty, loading, not-found, and error states for the main app routes.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- Docker Compose
- Vitest

## Project Docs

- [Architecture](docs/architecture.md): implemented routes, models, server actions, and data access.
- [Feature walkthrough](docs/feature-walkthrough.md): how vocabulary, reviews, CSV import/export, decks, deck study, and dashboard stats work.
- [Manual smoke test](docs/manual-smoke-test.md): local checklist for verifying the main flows.
- [Portfolio positioning](docs/portfolio-positioning.md): honest resume/demo framing for the current MVP.

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
- Decks: `http://localhost:3000/decks`
- Courses: `http://localhost:3000/courses`
- Review: `http://localhost:3000/review`

## Database Notes

- Local development uses Docker Compose PostgreSQL on host port `5433`.
- `npx prisma migrate dev` applies local migrations.
- `npm run db:seed` seeds safe level labels only; it does not add fake vocabulary.
- Portfolio deployments should use a hosted PostgreSQL database and run `npm run db:deploy` before build/start.
- Do not commit real database URLs or secrets.

Useful deployment commands:

```powershell
npm run db:generate
npm run db:deploy
npm run build
```

Required environment variable:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

## Verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
git diff --check
```

## Demo Walkthrough

Use a small curated vocabulary set for demos. `docs/sample-topic-packs.csv` is a tiny manually authored CSV with topic decks such as Greetings, Numbers, Family, and Daily verbs. Save/import it as CSV UTF-8 so tone-mark pinyin and Hanzi stay readable.

1. Start on the dashboard and point out active words, due reviews, recent practice, upcoming reviews, and level progress.
2. Open the vocabulary library, use search/filter controls, and confirm empty or filtered states are clear.
3. Add a vocabulary item, including optional deck, level, example, and memory notes.
4. Open the vocabulary detail page and inspect the word, example, memory notes, and review status.
5. Edit the vocabulary item and confirm the detail page reflects the change.
6. Open the review page, grade a due card, and return to the dashboard to confirm recent activity updates.
7. Create or open a deck, confirm its vocabulary list and due count, then launch deck study.
8. In deck study, reveal a card, move between cards, and submit a review grade after reveal.
9. Create or open a course, add an ordered lesson, link it to a deck, and use the lesson's study/review links.
10. Import a small CSV from `/vocabulary/import`, confirm readable validation errors for a bad row, then import a valid small file.
11. Export active vocabulary from the library or from a deck detail page.
12. Check loading, not-found, and error handling by using normal route transitions and invalid IDs during a local demo pass.

See [docs/manual-smoke-test.md](docs/manual-smoke-test.md) for a fuller checklist.

## Known Limitations

- No authentication or per-user ownership is implemented yet.
- The app is currently best framed as a single-user portfolio/demo app, not a public multi-user product.
- Quiz mode is not implemented yet, even though the schema has future quiz models.
- CSV import is intended for small manually curated files; it is not optimized for high-volume bulk imports.
- Vocabulary lists, review due-card lists, deck vocabulary, and deck study cards do not have pagination/session caps yet.
- Course lessons can link to decks, but there is no rich lesson content, media, enrollment, or publishing workflow.
- No AI-generated examples, mnemonics, audio, handwriting, or pronunciation scoring is included.

## Next Improvements

- Add pagination and session caps for large vocabulary libraries, due review queues, deck detail pages, and deck study.
- Add authentication and per-user query scoping before storing real user data in a public deployment.
- Add quiz mode as a separate practice flow that does not change spaced repetition scheduling.
- Add import size guidance, batching, and better progress feedback for larger CSV files.
- Add screenshots or a short demo GIF after the UI is deployed.
- Add richer analytics for weak cards, levels, tones, and review consistency.
- Add optional pronunciation/audio support.
