# Basis

An open-source hiring workspace built with Next.js, PostgreSQL, Better Auth, and Drizzle.

Basis helps teams run a lightweight recruiting flow end-to-end:

- onboarding a workspace
- publishing job roles
- collecting candidate applications
- moving candidates through hiring stages
- collaborating with comments, reviews, messages, and private notes

## Table of Contents

- [Why This Project](#why-this-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Detailed Getting Started](#detailed-getting-started)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [Scripts](#scripts)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Deployment Notes](#deployment-notes)

## Why This Project

Most recruiting tools are either overbuilt or fragmented. This project is designed to be a practical, modern baseline for teams that want:

- a transparent hiring pipeline they can customize
- a clean codebase for experimentation and extension
- self-hosted control over data and workflow

## Features

- Workspace onboarding flow with persisted team preferences
- Candidate application intake via public apply endpoint
- Stage-based hiring pipeline (Inbox, Screen, Interview, Decide, Offer, Declined, Archive)
- Job management with per-role candidate statistics
- Candidate collaboration features:
	- internal comments
	- scorecard-style reviews
	- messaging timeline
	- private recruiter notes
- Better Auth integration via `/api/auth/*`
- PostgreSQL-backed domain model with Drizzle migrations

## Tech Stack

- Framework: Next.js 16 (App Router)
- Runtime: React 19 + TypeScript
- Database: PostgreSQL 16
- Auth: Better Auth
- ORM / SQL tooling: Drizzle ORM + Drizzle Kit
- Styling: Tailwind CSS 4

## Architecture at a Glance

- `src/app`: app routes, UI pages, and API route handlers
- `src/lib/db`: DB client and Drizzle schema definitions
- `src/lib/platform-data.ts`: platform-specific data helpers and stage mapping logic
- `database/schema.sql`: base SQL initialization for first-time DB bootstrap
- `drizzle/`: generated migration files

Request flow in development:

1. Next.js API routes receive onboarding, application, and platform actions.
2. Route handlers execute SQL through the shared DB client.
3. UI pages fetch and render hydrated platform payloads.
4. Mutations return refreshed payloads to keep UI state in sync.

## Detailed Getting Started

This section is intentionally verbose so a new contributor can get productive quickly.

### 1) Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (recommended for local Postgres)
- Git

Confirm versions:

```bash
node -v
pnpm -v
docker -v
docker compose version
```

### 2) Clone and install

```bash
git clone <your-fork-or-repo-url>
cd hire
pnpm install
```

### 3) Create local environment file

Copy the example file and edit values as needed:

```bash
cp .env.example .env.local
```

Required variables:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hire"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a secure auth secret:

```bash
openssl rand -base64 32
```

### 4) Start PostgreSQL with Docker

```bash
docker compose up -d db
docker compose ps
```

Optional logs:

```bash
docker compose logs -f db
```

Important: `database/schema.sql` is automatically executed only when the Postgres volume is first created.

### 5) Run database migrations

```bash
pnpm db:migrate
```

If you enabled or updated Better Auth plugins (for example organization management),
generate the latest Better Auth Drizzle schema and then apply with Drizzle:

```bash
pnpm dlx auth generate
pnpm db:generate
pnpm db:migrate
```

If you make schema changes in `src/lib/db/schema`, generate then migrate:

```bash
pnpm db:generate
pnpm db:migrate
```

### 6) Start the app

```bash
pnpm dev
```

Open http://localhost:3000.

### 7) First-run functional check

Use this quick smoke test:

1. Open onboarding page and create a workspace.
2. Go to platform page and confirm job cards render.
3. Submit a sample application through a job application form.
4. Move the candidate from Inbox to later stages.
5. Add a comment, review, message, and private note.

If all five steps work, your local environment is healthy.

### 8) Daily development workflow

```bash
# terminal 1: database
docker compose up -d db

# terminal 2: app
pnpm dev
```

Before opening a PR:

```bash
pnpm lint
pnpm build
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by app and Drizzle CLI |
| `BETTER_AUTH_SECRET` | Yes | Secret used to sign auth/session tokens |
| `BETTER_AUTH_URL` | Yes | Base URL for Better Auth callbacks and links |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL used by client-side flows |
| `INVITE_EMAIL_PROVIDER` | Yes (for invites) | Invite email provider: `resend`, `postmark`, or `ses` |
| `INVITE_EMAIL_FROM` | Yes (for invites) | From address used for invitation emails |
| `RESEND_API_KEY` | If using Resend | Resend API key for sending invitation emails |
| `POSTMARK_SERVER_TOKEN` | If using Postmark | Postmark server token for sending invitation emails |
| `POSTMARK_MESSAGE_STREAM` | Optional | Postmark message stream (default: `outbound`) |
| `AWS_REGION` | If using SES | AWS region used by SES (`AWS_DEFAULT_REGION` also supported) |

## Database and Migrations

### Core concepts

- Postgres runs in Docker via `docker-compose.yml`
- Initial schema bootstrap SQL lives in `database/schema.sql`
- Incremental schema changes are tracked in `drizzle/`
- Drizzle config reads env values from `.env.local` then `.env`

### Useful commands

```bash
# generate migration files from schema changes
pnpm db:generate

# apply migrations
pnpm db:migrate

# open Drizzle Studio
pnpm db:studio
```

### Reset local DB completely

```bash
docker compose down -v
docker compose up -d db
pnpm db:migrate
```

Use reset only when you intentionally want to remove all local data.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build production app |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint checks |
| `pnpm db:generate` | Create Drizzle migration files |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## API Overview

Main routes:

- `POST /api/onboarding`: create workspace and seed default workspace context
- `POST /api/apply`: submit candidate application for a job
- `GET /api/platform`: fetch platform jobs/candidates payload
- `POST /api/platform`: execute platform actions (create job, move stage, add comments/reviews/messages, save notes)
- `/api/auth/*`: Better Auth endpoints

## Project Structure

```text
src/
	app/
		api/
			apply/
			auth/
			onboarding/
			platform/
		jobs/
		onboarding/
		platform/
	lib/
		auth.ts
		auth-client.ts
		platform-data.ts
		db/
			client.ts
			schema/
database/
	schema.sql
drizzle/
	*.sql
```

## Contributing

Contributions are welcome.

### Recommended process

1. Fork the repository and create a feature branch.
2. Keep changes scoped to one concern per PR.
3. Run `pnpm lint` and `pnpm build` locally.
4. Include clear reproduction/verification steps in the PR description.

### Commit style

Conventional commits are encouraged (example: `feat(platform): add stage filter badges`).

### What to include in PRs

- What changed
- Why it changed
- How you validated it
- Any migration or env changes needed by reviewers

## Troubleshooting

### Port 5432 already in use

Stop the conflicting service or update port mapping in `docker-compose.yml`.

### Drizzle command fails with missing `DATABASE_URL`

Ensure `.env.local` exists and includes `DATABASE_URL`.

### Schema changes not appearing

If using Docker with an existing volume, your init SQL will not rerun automatically. Either:

- create and run migrations with Drizzle, or
- reset the DB volume using `docker compose down -v`

### Auth errors about missing secret

Set `BETTER_AUTH_SECRET` in `.env.local` and restart the dev server.

## Deployment Notes

This project can be deployed anywhere Next.js and Postgres are supported.

Minimum production checklist:

1. Provision PostgreSQL and set a production `DATABASE_URL`.
2. Set secure `BETTER_AUTH_SECRET` and correct public URLs.
3. Run `pnpm db:migrate` against production database.
4. Build and start with `pnpm build && pnpm start`.

## Acknowledgements

- Next.js
- Better Auth
- Drizzle ORM
- PostgreSQL
