# Implementation Roadmap

## Roadmap Principles

- Build the learning loop before polish.
- Keep each phase demoable.
- Add AI only after vocabulary, reviews, history, and dashboard work reliably.
- Prefer small commits that show product evolution and engineering discipline.

## Phase 0: Planning

Deliverables:

- Product requirements.
- Technical plan.
- Data model draft.
- Implementation roadmap.
- Portfolio positioning.

Verification:

```powershell
git status --short
git diff --check
```

Suggested commits:

- `docs: define product requirements for Chinese learning companion`
- `docs: add technical plan and data model`
- `docs: add roadmap and portfolio positioning`

## Phase 1: Project Scaffold and Local Database

Tasks:

- Create Next.js App Router project with TypeScript.
- Add Tailwind.
- Add Prisma.
- Add Docker Compose for PostgreSQL.
- Configure environment example.
- Add basic README setup steps.
- Create initial Prisma schema from the data model.
- Run initial migration.

Verification:

```powershell
npm run lint
npm run typecheck
docker compose up -d
npx prisma migrate dev
npm run build
```

Suggested commits:

- `chore: scaffold next app with typescript and tailwind`
- `chore: add dockerized postgres and prisma setup`
- `db: add initial learning schema migration`

## Phase 2: Vocabulary Management

Tasks:

- Build vocabulary list page.
- Build create vocabulary form.
- Add validation for hanzi, pinyin, meaning, and level.
- Create review card automatically when vocabulary is created.
- Build vocabulary detail page.
- Add edit and archive behavior.
- Add basic search and level filter.

Verification:

```powershell
npm run lint
npm run typecheck
npm run build
npx prisma studio
```

Manual checks:

- Create a vocabulary item.
- Confirm a matching review card exists.
- Edit the item.
- Archive the item.
- Filter by level.

Suggested commits:

- `feat: add vocabulary creation flow`
- `feat: add vocabulary list filters`
- `feat: add vocabulary detail and archive controls`

## Phase 3: Spaced Repetition Core

Tasks:

- Implement pure review scheduler utility.
- Add unit tests for Again, Hard, Good, and Easy behavior.
- Build due-card query.
- Build review session start flow.
- Build active review screen with reveal and grading.
- Record review event and update review card in a transaction.
- Build review summary page.

Verification:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Manual checks:

- Start a session with due cards.
- Grade a card Again and confirm it becomes due soon.
- Grade a card Good and confirm interval increases.
- Confirm review history is persisted.
- Refresh during or after session and confirm data remains consistent.

Suggested commits:

- `feat: add spaced repetition scheduler`
- `test: cover review scheduling grades`
- `feat: add due card review session`
- `feat: record review history`

## Phase 4: Learning Dashboard

Tasks:

- Build dashboard metric queries.
- Show due count, total vocabulary, reviewed today, and accuracy.
- Show level distribution.
- Show recent review activity.
- Show difficult cards.
- Add primary navigation to review, vocabulary, and quiz.

Verification:

```powershell
npm run lint
npm run typecheck
npm run build
```

Manual checks:

- Add vocabulary and confirm total changes.
- Complete reviews and confirm reviewed-today count changes.
- Trigger missed reviews and confirm difficult cards update.
- Confirm dashboard empty states are useful.

Suggested commits:

- `feat: add learning dashboard metrics`
- `feat: show recent activity and difficult cards`

## Phase 5: Quiz Mode

Tasks:

- Add quiz setup page.
- Support quiz modes:
  - Hanzi to meaning.
  - Meaning to hanzi.
  - Pinyin to meaning.
- Generate questions from selected level or all vocabulary.
- Store quiz session and answers.
- Show quiz summary.
- Keep quiz results separate from review scheduling.

Verification:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Manual checks:

- Start a quiz from a level.
- Answer correctly and incorrectly.
- Confirm summary score.
- Confirm review due dates do not change after quiz answers.

Suggested commits:

- `feat: add quiz generation logic`
- `feat: add quiz session flow`
- `feat: persist quiz results`

## Phase 6: Product Polish and Portfolio Readiness

Tasks:

- Improve responsive layouts.
- Add loading, empty, and error states.
- Add seed data script with safe sample vocabulary.
- Add README with screenshots, setup, architecture, and deployment notes.
- Add smoke test checklist.
- Add production deployment documentation.

Verification:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
docker compose up -d
npx prisma migrate reset
```

Manual checks:

- Fresh setup from README works.
- App can be demoed from empty database.
- App can be demoed with seed data.
- Mobile layout is usable.

Suggested commits:

- `chore: add seed data for demo vocabulary`
- `docs: document setup and deployment`
- `style: polish responsive learning flows`

## Phase 7: Deployment

Tasks:

- Create production database.
- Configure Vercel project.
- Add environment variables.
- Run production migrations.
- Deploy app.
- Smoke test production.
- Add live URL to README.

Verification:

```powershell
npm run build
npx prisma migrate deploy
```

Production smoke tests:

- Open dashboard.
- Create vocabulary.
- Complete review.
- View review history.
- Complete quiz.
- Confirm dashboard updates.

Suggested commits:

- `chore: configure production deployment`
- `docs: add live demo and production notes`

## Optional Phase 8: AI Enhancements

Only start this after the core learning loop is stable.

Possible tasks:

- Generate mnemonic suggestions.
- Generate example sentences by level.
- Explain grammar notes from user-provided examples.
- Suggest distractors for quiz questions.

Guardrails:

- AI output should be editable.
- Do not make AI required for core app use.
- Store prompts and outputs carefully if persistence is needed.
- Add clear loading and error states.

Suggested commits:

- `feat: add optional AI-generated mnemonics`
- `feat: add editable AI example suggestions`

## Suggested Pull Request Breakdown

- PR 1: Planning docs.
- PR 2: Scaffold, Tailwind, Prisma, Docker Compose.
- PR 3: Vocabulary CRUD and levels.
- PR 4: Spaced repetition scheduler and review flow.
- PR 5: Dashboard metrics.
- PR 6: Quiz mode.
- PR 7: Polish, README, deployment.
- PR 8: Optional AI features.
