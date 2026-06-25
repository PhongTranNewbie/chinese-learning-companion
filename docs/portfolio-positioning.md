# Portfolio Positioning

## Project Pitch

Chinese Learning Companion is a full-stack Mandarin study tool that helps learners collect vocabulary, organize it by level, review it with spaced repetition, track learning history, and practice with quizzes.

The project is designed to show that the developer can build a useful product with real domain logic, not just standard CRUD screens.

## How This Differs From Portfolio 1

Portfolio 1, the Expense Tracker, demonstrates:

- Production-ready CRUD.
- Authentication.
- Per-user data ownership.
- Dashboard analytics.
- Prisma and PostgreSQL.
- Deployment polish.

Portfolio 2 should demonstrate a different skill profile:

- Domain-specific learning logic through spaced repetition.
- Algorithmic state transitions for review scheduling.
- Immutable event history through review events.
- Quiz generation and scoring.
- Education-focused UX.
- More nuanced data modeling for vocabulary, cards, sessions, events, and levels.
- Product restraint by avoiding a broad gamified course platform.

## Portfolio Story

Suggested portfolio summary:

```text
Built a Chinese Learning Companion for Mandarin vocabulary study with level-based organization, spaced repetition review scheduling, quiz sessions, review history, and dashboard insights. The project emphasizes domain modeling and learning algorithms using Next.js, TypeScript, Prisma, PostgreSQL, Docker Compose, and Tailwind.
```

## Strong Resume Bullets

- Built a Mandarin learning app with spaced repetition scheduling, review history, quiz mode, and learning analytics using Next.js, TypeScript, Prisma, and PostgreSQL.
- Designed a domain model for vocabulary, HSK levels, review cards, immutable review events, quiz sessions, and learner progress metrics.
- Implemented a deterministic SM-2-inspired scheduler with graded recall outcomes and unit tests for interval, ease factor, and due-date transitions.
- Dockerized local PostgreSQL development and documented a production deployment path for Vercel and managed Postgres.

## Developer Skills Demonstrated

- Full-stack product planning.
- Relational data modeling.
- Domain logic design.
- Scheduling algorithm implementation.
- Transactional database updates.
- Dashboard aggregation.
- Form validation.
- Testing strategy.
- Deployment readiness.
- Product scope control.

## What Reviewers Should Notice

- The app solves a personal, concrete learning problem.
- The data model is richer than a simple list of records.
- Review scheduling is explainable and testable.
- Quiz mode is intentionally separate from spaced repetition state.
- The roadmap shows professional sequencing.
- The project is realistic for a junior developer while still technically interesting.

## Demo Narrative

A strong demo can follow this flow:

1. Show the dashboard with due cards and progress metrics.
2. Add a new Mandarin vocabulary item with hanzi, pinyin, meaning, level, and example sentence.
3. Start a review session and grade recall.
4. Open the vocabulary detail page to show review history and next due date.
5. Run a short quiz for a selected level.
6. Return to the dashboard and show updated activity.

## README Positioning

The README should eventually include:

- Live demo URL.
- Screenshots or short GIFs.
- Problem statement.
- Feature list.
- Tech stack.
- Architecture notes.
- Spaced repetition explanation.
- Data model diagram.
- Local setup with Docker Compose.
- Test commands.
- Deployment notes.
- Future improvements.

## Avoid These Portfolio Pitfalls

- Do not market it as a complete Chinese course.
- Do not overemphasize AI before the core app works.
- Do not make it look like a generic flashcard CRUD project.
- Do not import large vocabulary datasets without checking licensing.
- Do not hide the scheduling logic inside UI components.
- Do not skip tests for the scheduler.

## Future Differentiators

After MVP:

- AI-generated mnemonics with editable output.
- Weakness analytics by tone or level.
- CSV import for personal study lists.
- Audio pronunciation support.
- PWA polish for mobile review sessions.
- Anki export.
