# Product Requirements

## Current Status

This document started as the product plan. The current portfolio MVP implements vocabulary management, decks, lightweight courses/lessons, small manual CSV import/export, spaced repetition reviews, review history, and dashboard metrics. Quiz mode, authentication/per-user ownership, AI features, and pagination/session caps are future improvements.

## Product Summary

Chinese Learning Companion is a focused Mandarin study app for learners who want to build durable vocabulary knowledge through structured flashcards, HSK or custom levels, spaced repetition, deck study, and progress visibility.

The app is not a Duolingo clone. It should feel more like a personal learning workstation: fast to add vocabulary, clear about what needs review today, and honest about long-term retention.

## Problem Statement

Mandarin learners often collect vocabulary across textbooks, videos, apps, notes, and conversations, but the words become scattered. Generic flashcard tools can help, yet they rarely expose enough language-specific structure such as characters, pinyin, tones, HSK level, example sentences, measure words, and review history in one place.

This project solves that problem by giving the learner a small, reliable system for turning Chinese vocabulary into reviewable knowledge.

## Target User

Primary user:

- A self-directed Mandarin learner who wants to manage vocabulary and review consistently.
- Comfortable using a web app on desktop or mobile.
- Wants more control and transparency than a gamified learning app provides.

Secondary portfolio audience:

- Recruiters and engineering reviewers looking for a junior/full-stack project with meaningful product thinking, data modeling, and domain logic beyond standard CRUD.

## Goals

- Help a learner maintain a vocabulary bank with Chinese-specific fields.
- Schedule reviews using a transparent spaced repetition algorithm.
- Show what is due today and how learning progress changes over time.
- Keep room for future quiz sessions that reinforce recognition and recall without changing spaced repetition state.
- Demonstrate full-stack engineering: Next.js App Router, TypeScript, Prisma, PostgreSQL, Docker Compose, Tailwind, and portfolio deployment documentation.

## Non-Goals

- Do not build a full language course.
- Do not copy Duolingo-style streak mechanics, levels, hearts, or animated lesson paths.
- Do not build social learning, leaderboards, chat, or forums in the MVP.
- Do not rely on AI for the core learning loop.
- Do not require native mobile apps.
- Do not attempt complete dictionary coverage.

## Current MVP Scope

The current portfolio MVP includes:

- Vocabulary management with Chinese-specific fields.
- HSK or level-based organization.
- Flashcard review queue driven by spaced repetition.
- Review grading such as Again, Hard, Good, Easy.
- Review history for each card.
- Learning dashboard with due count, active vocabulary, archived count, recent activity, upcoming reviews, and level breakdown.
- Decks, deck study, lightweight courses, and ordered lessons.
- Small manually curated CSV import/export.
- Dockerized local PostgreSQL.
- Portfolio deployment notes.

## Out of Scope for MVP

- AI-generated example sentences.
- OCR from screenshots or textbooks.
- Speech recognition and pronunciation scoring.
- Handwriting recognition.
- Public shared decks.
- Paid subscriptions.
- Import from Anki.
- Full offline mode.
- Multi-language interface.
- Authentication and per-user ownership.
- Quiz mode.
- Pagination and review-session caps for large libraries.

## User Stories

- As a learner, I want to add a vocabulary item with hanzi, pinyin, meaning, level, and example sentence so I can study words from my real learning materials.
- As a learner, I want to assign words to a level or deck so I can focus on the right difficulty range.
- As a learner, I want to see which cards are due today so I can start reviewing quickly.
- As a learner, I want to grade each review so the app can decide when to show the card again.
- As a learner, I want to inspect a word's review history so I can understand why it is easy or difficult.
- As a learner, I eventually want quiz mode so I can practice recognition without changing the main review schedule.
- As a learner, I want a dashboard so I can see my study consistency and retention trends.
- As a developer portfolio reviewer, I want to see domain-specific scheduling logic, relational modeling, and deployment readiness.

## Core User Flows

### Add Vocabulary

1. User opens the vocabulary page.
2. User clicks add vocabulary.
3. User enters hanzi, pinyin, meaning, optional part of speech, level, deck, and example sentence.
4. App validates required fields.
5. App creates a vocabulary item and initial review state.
6. Item appears in the vocabulary list and can enter the review queue.

### Review Due Cards

1. User opens the dashboard or review page.
2. App shows count of cards due now.
3. App lists due cards.
4. User grades recall: Again, Hard, Good, or Easy.
5. App records review history and updates the next due date, interval, ease factor, and lapse count.
6. Dashboard activity reflects the completed review.

### Browse and Filter Vocabulary

1. User opens vocabulary page.
2. User filters by level, deck, or search text.
3. User opens a vocabulary detail page.
4. App shows card details, examples, review state, and review history.

### Future Quiz Mode

1. User opens quiz page.
2. User chooses mode, such as hanzi to meaning, meaning to hanzi, or pinyin recognition.
3. App generates a short quiz from selected levels or due vocabulary.
4. User answers questions.
5. App shows score and corrections.
6. Quiz results may be stored separately but should not replace spaced repetition review grading in the MVP.

### Dashboard

1. User opens the app root.
2. App shows due today, total vocabulary, cards learned, recent reviews, accuracy, and level distribution.
3. User can jump to review, add vocabulary, vocabulary list, decks, or courses.

## Suggested Pages and Routes

- `/` - Dashboard overview and primary actions.
- `/vocabulary` - Searchable vocabulary table or list.
- `/vocabulary/new` - Create vocabulary item.
- `/vocabulary/[id]` - Vocabulary detail, edit controls, review history.
- `/review` - Due-card review launcher.
- `/vocabulary/import` - Small manual CSV import.
- `/decks` - Deck list.
- `/decks/[id]` - Deck detail.
- `/decks/[id]/study` - Deck study mode.
- `/courses` - Course list.
- `/courses/[id]` - Course detail.
- `/api/vocabulary/export` - Active vocabulary CSV export.
- Future: `/quiz`, `/quiz/session`, and `/quiz/summary`.
- Future: `/levels`, `/settings`, and `/login` if those features are added.

## MVP Success Criteria

- A user can create vocabulary items with Chinese-specific metadata.
- A user can review due cards and produce persistent review history.
- The app can calculate next due dates from review grades.
- Dashboard metrics reflect real database state.
- Local setup works with Docker Compose and PostgreSQL.
- The portfolio deployment path is documented and realistic.

## Product Risks

- The MVP could become too broad if dictionary, AI, and pronunciation features are added too early.
- Poor review scheduling logic could make the app feel untrustworthy.
- Future quiz mode could blur with review mode unless the distinction is clear.
- HSK data licensing should be checked before importing external lists.
- Auth can add complexity; a single-user MVP may be enough if time is limited.

## Future Improvements

- Pagination and session caps for large vocabulary/review/deck views.
- Quiz mode outside scheduled reviews.
- Authentication and per-user query scoping.
- Larger CSV import support with batching/progress feedback.
- Optional AI examples and mnemonic generation after core review flow is stable.
- Audio pronunciation via a third-party text-to-speech API.
- Writing practice mode with stroke-order resources.
- Anki export.
- Custom decks.
- Weak-word insights by tone, level, tag, or part of speech.
- Mobile-first polish and installable PWA behavior.
