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

1. Open `/` and confirm the dashboard loads with useful empty or populated states.
2. Open `/vocabulary` and confirm the vocabulary library, search, level filter, and deck filter load.
3. Open `/vocabulary/new`, create a vocabulary item, and confirm it appears in the active list.
4. Open the new item's detail page and confirm its learning fields and review card are visible.
5. Edit the item and confirm the detail page reflects the changes.
6. Open `/review`, submit one review grade, and confirm the card updates.
7. Return to `/` and confirm recent review activity appears.
8. Create a deck, assign vocabulary to it, and confirm the deck detail vocabulary list is readable.
9. Open `/decks/[id]/study`, reveal a card, move between cards, and submit a review grade after reveal.
10. Import a small CSV with a missing `hanzi` or `meaning` value and confirm row-level errors are readable.
11. Import a valid small CSV, confirm new rows appear, and export active vocabulary from `/vocabulary`.
12. Export a deck-filtered CSV from a deck detail page.
13. Create a course, add lessons, link one lesson to a deck, and confirm the lesson study link opens deck study mode.
14. Archive a lesson and confirm it disappears from the active lesson list.
15. Archive a course and confirm it disappears from the active course list.
16. Archive a deck and confirm active study/import links are hidden.
17. Archive the vocabulary item and confirm it no longer appears in active list or review flows.
18. Visit an invalid detail URL and confirm the not-found page is friendly.
19. During local development, confirm route loading and global error states render without admin-like copy.

## Portfolio Demo Checklist

- Dashboard: active words, due reviews, recent practice, upcoming reviews, level breakdown.
- Vocabulary library: list, search, filters, empty state, export link.
- Vocabulary detail: examples, memory notes, review status, edit/archive actions.
- Review flow: due-card query, grade buttons, review history update.
- Decks: list, detail vocabulary table, archive behavior.
- Deck study: all-cards mode, due-only mode, reveal flow, review grading.
- Courses: list, detail lesson order, deck-linked study actions.
- Forms: add/edit vocabulary, deck, course, and lesson validation.
- CSV import/export: small manual CSV import, validation errors, active vocabulary export.
- Empty/loading/error states: empty lists, invalid IDs, route loading, global error boundary.

## Production Checks

1. Confirm `DATABASE_URL` is set in the hosting provider.
2. Run `npm run db:deploy` against the production database.
3. Run `npm run db:seed` only if safe level labels are needed.
4. Open the deployed app and repeat the app flow above.

Do not use real private study data for public portfolio demos. Add authentication and per-user query scoping before treating a deployment as a public multi-user product.
