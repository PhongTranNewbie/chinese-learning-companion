# Portfolio Positioning

## Current Project Pitch

Chinese Learning Companion is a full-stack Mandarin study tool that helps a learner collect vocabulary, organize it by level and deck, review due cards with spaced repetition, track review history, and understand progress through a database-backed dashboard.

The current MVP is honest portfolio software: useful, scoped, and demoable, with real domain logic in the review scheduler. It is not a complete course platform, a public multi-user product, or a quiz app yet.

## How This Differs From Portfolio 1

Portfolio 1, the Expense Tracker, demonstrates:

- Production-ready CRUD.
- Authentication.
- Per-user data ownership.
- Dashboard analytics.
- Prisma and PostgreSQL.
- Deployment polish.

Portfolio 2 demonstrates a different skill profile:

- Domain-specific learning logic through spaced repetition.
- Algorithmic state transitions for review scheduling.
- Immutable review history through review events.
- Education-focused UX for vocabulary, decks, courses, and review.
- More nuanced data modeling for vocabulary, review cards, review events, levels, decks, courses, and lessons.
- Product restraint by keeping quiz mode, AI, auth, and large import tooling out of the first portfolio demo.

## Portfolio Story

Suggested portfolio summary:

```text
Built a Chinese Learning Companion for Mandarin vocabulary study with level-based organization, deck study, spaced repetition review scheduling, review history, CSV import/export for small manual study lists, and dashboard insights. The project emphasizes domain modeling and learning algorithms using Next.js, TypeScript, Prisma, PostgreSQL, Docker Compose, and Tailwind.
```

## Strong Resume Bullets

- Built a Mandarin learning app with vocabulary management, deck study, spaced repetition scheduling, review history, and learning analytics using Next.js, TypeScript, Prisma, and PostgreSQL.
- Designed a domain model for vocabulary, levels, decks, courses, lessons, review cards, immutable review events, and future quiz/auth expansion.
- Implemented a deterministic SM-2-inspired scheduler with graded recall outcomes and unit tests for interval, ease factor, lapse, and due-date transitions.
- Added CSV import/export for small manually curated study lists, including row validation, duplicate skipping, and review-card creation.
- Dockerized local PostgreSQL development and documented a realistic portfolio deployment path with managed Postgres.

## Developer Skills Demonstrated

- Full-stack product planning.
- Relational data modeling.
- Domain logic design.
- Scheduling algorithm implementation.
- Transactional database updates.
- Dashboard aggregation.
- Form validation.
- CSV parsing/export.
- Testing strategy.
- Deployment documentation.
- Product scope control.

## What Reviewers Should Notice

- The app solves a personal, concrete learning problem.
- The data model is richer than a simple list of records.
- Review scheduling is explainable, deterministic, and tested.
- Review submissions write immutable history and update current card state in one transaction.
- Deck study reuses the review system instead of creating a parallel flashcard flow.
- The dashboard reads real database state and has bounded summary panels.
- The project is realistic for a junior/full-stack portfolio while still technically interesting.

## Demo Narrative

A strong demo can follow this flow:

1. Show the dashboard with active vocabulary, due cards, recent practice, upcoming reviews, and level progress.
2. Open the vocabulary library and demonstrate search, deck filter, level filter, and empty/filter states.
3. Add a Mandarin vocabulary item with hanzi, pinyin, meaning, level, deck, example sentence, and optional memory notes.
4. Open the vocabulary detail page to show the learning fields and review status.
5. Grade a due card from the review page and return to the dashboard to show updated activity.
6. Open a deck, inspect its vocabulary list, and start deck study.
7. Reveal a deck study card, move between cards, and submit a review grade.
8. Open a course, add or inspect a lesson linked to a deck, and use the lesson study links.
9. Import a small manual CSV, demonstrate a validation error if useful, and export active vocabulary.
10. Close by naming known limitations: no auth, no quiz mode, no AI, and no pagination/session caps yet.

## README Positioning

The README should include:

- Concise project overview.
- Current implemented features.
- Tech stack.
- Local setup with Docker Compose.
- Database, migration, and seed notes.
- Verification commands.
- Demo walkthrough.
- Known limitations.
- Next improvements.

Avoid adding screenshots or GIF claims until real files exist.

## Avoid These Portfolio Pitfalls

- Do not market it as a complete Chinese course.
- Do not claim quiz mode, auth, AI, or multi-user ownership is implemented.
- Do not describe the CSV importer as a high-volume bulk import pipeline.
- Do not imply public production readiness before auth and per-user query scoping exist.
- Do not import large vocabulary datasets without checking licensing.
- Do not hide the scheduling logic inside UI components.
- Do not skip tests for the scheduler.

## Future Differentiators

After the portfolio MVP:

- Pagination and review-session caps for larger libraries.
- Authentication and per-user data scoping.
- Quiz mode that stays separate from spaced repetition scheduling.
- Weakness analytics by tone, level, part of speech, or lapse history.
- CSV import batching and progress feedback.
- AI-generated mnemonics with editable output.
- Audio pronunciation support.
- PWA polish for mobile review sessions.
- Anki export.
