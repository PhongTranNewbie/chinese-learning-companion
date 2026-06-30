# Manual Smoke Test

Use this checklist after local setup, before a portfolio demo, and after deployment.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Run `npx prisma migrate dev`.
4. Run `npm run db:seed`.
5. Start the app with `npm run dev`.

The local PostgreSQL service is published on host port `5433`.

## App Flow

1. Open `/` and confirm the dashboard loads.
2. Open `/vocabulary` and confirm the vocabulary list loads.
3. Open `/vocabulary/new`, create a vocabulary item, and confirm it appears in the active list.
4. Open the new item's detail page and confirm its review card is visible.
5. Edit the item and confirm the detail page reflects the changes.
6. Open `/review`, submit one review grade, and confirm the card updates.
7. Return to `/` and confirm recent review activity appears.
8. Create a deck, assign vocabulary to it, and confirm `/decks/[id]/study` works.
9. Import a CSV with a missing `hanzi` or `meaning` value and confirm row-level errors are readable.
10. Create a course, add lessons, link one lesson to a deck, and confirm the lesson study link opens deck study mode.
11. Archive a lesson and confirm it disappears from the active lesson list.
12. Archive a course and confirm it disappears from the active course list.
13. Archive a deck and confirm active study/import links are hidden.
14. Archive the vocabulary item and confirm it no longer appears in active list or review flows.

## Production Checks

1. Confirm `DATABASE_URL` is set in the hosting provider.
2. Run `npm run db:deploy` against the production database.
3. Run `npm run db:seed` only if safe level labels are needed.
4. Open the deployed app and repeat the app flow above.

Do not use real private study data for public portfolio demos.
