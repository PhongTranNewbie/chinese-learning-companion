# Chinese Learning Companion

A Mandarin vocabulary study app planned around level-based organization, spaced repetition reviews, review history, dashboard metrics, and quiz practice.

This repository is currently at Phase 1: project foundation only. Product features will be implemented in later phases.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Docker Compose

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
docker compose up -d
```

Generate the Prisma client:

```powershell
npx prisma generate
```

Validate the Prisma schema:

```powershell
npx prisma validate
```

Prisma reads the database URL from `.env` through `prisma.config.ts`.

Run the development server:

```powershell
npm run dev
```

## Verification Commands

```powershell
npm run lint
npm run typecheck
npm run build
docker compose config
npx prisma validate
```

## Current Scope

Implemented:

- Next.js App Router foundation.
- TypeScript configuration.
- Tailwind CSS setup.
- Docker Compose PostgreSQL service.
- Prisma schema draft for the learning domain.
- Basic README setup instructions.

Not implemented yet:

- Vocabulary UI.
- Review flow.
- Dashboard.
- Quiz mode.
- Authentication.
- AI features.
- Production deployment.
