# LOL vNext — Deploy & Release Guide

Target Logistics Solution LLC — Transportation Management & Profit Control System.

Last updated: 2026-03-13

---

## 1. Architecture Overview

```
                     ┌──────────────┐
  Browser ──────────▶│  Web (Next.js)│  port 3000
                     └──────┬───────┘
                            │ NEXT_PUBLIC_API_URL
                     ┌──────▼───────┐
                     │  API (NestJS) │  port 3001
                     └──────┬───────┘
                            │ POSTGRES_*
                     ┌──────▼───────┐
                     │  PostgreSQL 16│  port 5432
                     └──────────────┘
```

Monorepo layout (npm workspaces):

```
lol-vnext/
├── packages/shared/   # @lol/shared — types, enums, permission matrix
├── packages/api/      # @lol/api   — NestJS 10 REST API
├── packages/web/      # @lol/web   — Next.js 14 SSR/CSR frontend
├── docker-compose.yml # PostgreSQL only (no app containers yet)
├── .env.example
└── tsconfig.base.json
```

---

## 2. Web Deploy Contract

### What gets deployed

Next.js 14 with App Router. Output mode: default (Node.js server, not static export).
The build produces `.next/` directory containing server and client bundles.

### Build sequence

```bash
# 1. Shared must build FIRST (web imports @lol/shared)
npm run build -w packages/shared     # tsc → packages/shared/dist/

# 2. Web build
npm run build -w packages/web        # next build → packages/web/.next/
```

### Runtime command

```bash
cd packages/web
npm run start                        # next start -p 3000
```

### Build-time environment

| Variable              | Required | Notes                                        |
|-----------------------|----------|----------------------------------------------|
| `NEXT_PUBLIC_API_URL` | YES      | Baked into client JS at build time            |

`NEXT_PUBLIC_API_URL` is inlined into the browser bundle during `next build`.
Changing it requires a full rebuild — there is no runtime override for client code.

### Runtime environment

Next.js server itself needs no additional env vars beyond `PORT` (defaults to 3000 via `-p 3000` flag).

### Deploy targets (choose one)

| Target        | Notes                                                         |
|---------------|---------------------------------------------------------------|
| Vercel        | Zero-config for Next.js. Set `NEXT_PUBLIC_API_URL` in Vercel dashboard. Root directory: `packages/web`. Install command: `cd ../.. && npm install && npm run build -w packages/shared`. |
| Docker/VPS    | Build in CI, copy `.next/`, `node_modules`, `package.json`. Run `node_modules/.bin/next start -p 3000`. |
| Static export | NOT supported — app uses `'use client'` with sessionStorage.  |

### CORS note

The API enables CORS globally (`app.enableCors()` in `main.ts`). For production, restrict origins:

```typescript
app.enableCors({ origin: 'https://lol.tlslogistics.us' });
```

---

## 3. API Deploy Contract

### What gets deployed

NestJS 10 compiled to plain JS via `nest build`. Output directory: `packages/api/dist/`.

### Build sequence

```bash
# 1. Shared must build FIRST (API imports @lol/shared)
npm run build -w packages/shared     # tsc → packages/shared/dist/

# 2. API build
npm run build -w packages/api        # nest build → packages/api/dist/
```

### Runtime command

```bash
cd packages/api
node dist/main.js
```

Or via npm script: `npm run start:prod -w packages/api`.

### Migration strategy

Migrations are TypeORM files in `packages/api/src/database/migrations/`.

| Environment | Strategy |
|-------------|----------|
| Development | `migrationsRun: true` — auto-applied on startup (NODE_ENV != 'production') |
| Staging     | Set `NODE_ENV=staging` — auto-applied on startup (same as dev) |
| Production  | Set `NODE_ENV=production` — **migrations do NOT auto-run**. Run explicitly: |

```bash
# Explicit migration (production)
npm run migration:run -w packages/api

# Revert last migration
npm run migration:revert -w packages/api
```

Current migrations (in order):

```
1710000000000-CreateUsersTable
1710000001000-CreateWeeksTable
1710000002000-CreateLoadsTable
1710000003000-CreateIntegrationEventsTable
1710000004000-AddAuditSourceToLoads
1710000004500-AddFinanceColumnsToLoads
1710000005000-CreateSalaryRulesTable
1710000006000-CreateSalaryRecordsTable
1710000007000-CreateSalaryWeekStatesTable
1710000008000-CreateSalaryAuditLogsTable
1710000009000-AddRevisionToSalaryRecords
1710000010000-CreateMasterDataTables
```

All migrations use `IF NOT EXISTS` / `IF EXISTS` for idempotency.

### Seeding

```bash
# Create admin user (idempotent)
npm run seed -w packages/api

# Full demo data (dispatchers, weeks, loads, salary rules)
npx ts-node -r tsconfig-paths/register packages/api/src/database/seed-demo.ts
```

### Health endpoint

```
GET /api/health
```

Response:
```json
{ "status": "ok", "timestamp": "2026-03-13T...", "version": "0.1.0" }
```

`status` is `"ok"` when Postgres responds to `SELECT 1`, `"degraded"` otherwise.

---

## 4. Environment Variable Matrix

### Required for all environments

| Variable              | API | Web | Default                  | Production action            |
|-----------------------|-----|-----|--------------------------|------------------------------|
| `POSTGRES_HOST`       | yes | —   | `localhost`              | Set to DB host/IP            |
| `POSTGRES_PORT`       | yes | —   | `5432`                   | Set if non-standard          |
| `POSTGRES_USER`       | yes | —   | `lol`                    | Use dedicated DB user        |
| `POSTGRES_PASSWORD`   | yes | —   | `lol_secret`             | MUST CHANGE — use secret mgr |
| `POSTGRES_DB`         | yes | —   | `lol_vnext`              | Keep or customize            |
| `JWT_SECRET`          | yes | —   | `dev-secret-change-me`   | MUST CHANGE — min 32 chars, random |
| `NODE_ENV`            | yes | —   | _(unset)_                | Set `production`             |
| `NEXT_PUBLIC_API_URL` | —   | yes | `http://localhost:3001`  | Set to production API URL    |

### Optional / have safe defaults

| Variable              | API | Web | Default                   | Notes                        |
|-----------------------|-----|-----|---------------------------|------------------------------|
| `API_PORT`            | yes | —   | `3001`                    | Change if port conflict      |
| `JWT_EXPIRES_IN`      | yes | —   | `8h`                      | Token TTL                    |
| `SEED_ADMIN_EMAIL`    | yes | —   | `admin@tlslogistics.us`   | Only used by seed script     |
| `SEED_ADMIN_PASSWORD` | yes | —   | `admin123`                | Only used by seed script     |

### Not currently used in code (defined in .env.example only)

| Variable        | Notes                              |
|-----------------|------------------------------------|
| `DATABASE_URL`  | DSN format — not read by any code  |
| `API_HOST`      | Not referenced in main.ts          |
| `WEB_PORT`      | Not referenced in web scripts      |

### Security checklist

Before any non-local deploy:

- [ ] `JWT_SECRET` changed from default — at least 32 random characters
- [ ] `POSTGRES_PASSWORD` changed from default
- [ ] `SEED_ADMIN_PASSWORD` changed from default (or seed not run)
- [ ] `NODE_ENV` set to `production` (disables auto-migration, disables SQL logging)
- [ ] `NEXT_PUBLIC_API_URL` points to the real API domain (HTTPS)
- [ ] CORS in `main.ts` restricted to actual frontend domain

---

## 5. Full Build & Deploy Commands

### From-scratch deploy (staging or production)

```bash
# 0. Prerequisites: Node >= 20, npm >= 10, PostgreSQL 16 accessible

# 1. Clone and install
git clone <repo> && cd lol-vnext
cp .env.example .env
# Edit .env with environment-specific values
npm install

# 2. Build all packages (order matters: shared → api, shared → web)
npm run build -w packages/shared
npm run build -w packages/api
npm run build -w packages/web

# 3. Run migrations (production — explicit)
NODE_ENV=production npm run migration:run -w packages/api

# 4. Seed admin user
npm run seed -w packages/api

# 5. Start API
cd packages/api && NODE_ENV=production node dist/main.js &

# 6. Start Web
cd packages/web && npm run start &
```

### Shorthand for CI

```bash
npm install
npm run build -w packages/shared
npm run build -w packages/api
npm run build -w packages/web
npm run test:api
npm run test -w packages/shared
cd packages/web && npx next lint
```

---

## 6. Staging Smoke Checklist

Run after every staging deploy. All checks are manual until automated E2E exists.

### Infrastructure

- [ ] `GET /api/health` returns `{ "status": "ok" }`
- [ ] Web loads at root URL without JS errors (open browser console)
- [ ] Login page renders

### Auth

- [ ] Login with admin credentials succeeds — redirects to home
- [ ] Login with wrong password shows error
- [ ] Token persists in sessionStorage as `lol_token`
- [ ] Refreshing page retains login state

### Loads (core flow)

- [ ] Loads page renders — table shows existing loads (or empty state)
- [ ] "New Load" form opens — all 4 EntityPickers load data (dispatcher required; driver, unit, brokerage optional)
- [ ] Create a load — appears in table, SYL number assigned
- [ ] Edit a load — pickers pre-select correct items, save works
- [ ] Export CSV — downloads file with correct data

### RBAC

- [ ] Admin sees Settings, Salary nav items
- [ ] Dispatcher does NOT see Settings nav item
- [ ] Assistant gets "Access Denied" on Salary page
- [ ] Assistant cannot access export button on Loads

### Salary / Statements

- [ ] Salary page renders for Admin/Accountant
- [ ] Generate salary for a week — records appear
- [ ] Freeze week — state changes, buttons update
- [ ] Statements page renders — unit picker works

### Master Data Pickers

- [ ] Dispatcher picker shows users with Dispatcher role
- [ ] Driver/Unit/Brokerage pickers show "No items available" if tables empty
- [ ] After inserting test rows, pickers populate correctly
- [ ] Search filter works when > 5 items

### Edge cases

- [ ] Expired JWT (after 8h or token removal) redirects to login
- [ ] API returns 403 for unauthorized role access (test with curl)
- [ ] Health endpoint returns `"degraded"` if DB is unreachable

---

## 7. Release Checklist

### Pre-release

- [ ] All feature branches merged to release branch
- [ ] `npm run build -w packages/shared` — clean
- [ ] `npm run build -w packages/api` — clean
- [ ] `npx tsc -p packages/web/tsconfig.json --noEmit` — clean
- [ ] `cd packages/web && npx next lint` — no warnings/errors
- [ ] `npm run test:api` — all tests pass (currently 185)
- [ ] `npm run test -w packages/shared` — all tests pass (currently 46)
- [ ] `.env` reviewed: no dev defaults in staging/prod
- [ ] JWT_SECRET is not `dev-secret-change-me`
- [ ] POSTGRES_PASSWORD is not `lol_secret`
- [ ] CORS origin is restricted (not open `enableCors()`)

### Deploy

- [ ] Back up production database: `pg_dump -Fc lol_vnext > backup_$(date +%Y%m%d_%H%M).dump`
- [ ] Run migrations: `NODE_ENV=production npm run migration:run -w packages/api`
- [ ] Deploy API — restart process / container
- [ ] Rebuild web with production `NEXT_PUBLIC_API_URL`
- [ ] Deploy Web — restart process / container
- [ ] Run staging smoke checklist (section 6)

### Post-release

- [ ] Verify `/api/health` returns `"ok"` and correct version
- [ ] Verify login + load creation works end-to-end
- [ ] Monitor logs for unexpected errors (first 30 min)
- [ ] Tag release in git: `git tag v0.X.0 && git push --tags`

---

## 8. Rollback / Redeploy Guidance

### API rollback

```bash
# 1. Revert migration (if new migration was applied)
NODE_ENV=production npm run migration:revert -w packages/api

# 2. Deploy previous build artifacts
#    (keep previous dist/ directory or rebuild from previous tag)
git checkout v0.X.0
npm run build -w packages/shared
npm run build -w packages/api
cd packages/api && NODE_ENV=production node dist/main.js
```

### Web rollback

```bash
# Rebuild from previous tag with correct NEXT_PUBLIC_API_URL
git checkout v0.X.0
npm run build -w packages/shared
NEXT_PUBLIC_API_URL=https://api.lol.tlslogistics.us npm run build -w packages/web
cd packages/web && npm run start
```

### Database rollback

```bash
# Restore from pg_dump backup
pg_restore -d lol_vnext --clean backup_YYYYMMDD_HHMM.dump
```

### Zero-downtime notes

The current setup does NOT support zero-downtime deploys. Both API and Web require a restart. For future improvement, consider blue-green deploy with a reverse proxy (nginx/Caddy) or container orchestration (Docker Compose with rolling updates or Kubernetes).

---

## 9. Assumptions and Known Gaps

| Item | Status | Notes |
|------|--------|-------|
| No Dockerfile for API or Web | Gap | Only `docker-compose.yml` for PostgreSQL exists. Containerized deploys need Dockerfiles. |
| No CI/CD pipeline | Gap | No `.github/workflows/` or equivalent. Build/test/deploy is manual. |
| CORS is fully open | Risk | `app.enableCors()` in `main.ts` allows all origins. Must restrict before production. |
| `DATABASE_URL` unused | Info | Present in `.env.example` but no code reads it. Safe to remove or ignore. |
| `API_HOST` / `WEB_PORT` unused | Info | Defined in `.env.example` but not read by code. |
| `migrationsRun` for staging | Decision | Currently auto-runs for any `NODE_ENV != 'production'`. Staging with `NODE_ENV=staging` will auto-run. Set `NODE_ENV=production` for staging if you want explicit migration control. |
| No HTTPS termination | Gap | Neither API nor Web handle TLS. Use a reverse proxy (nginx, Caddy, cloud LB) for HTTPS. |
| No process manager | Gap | No PM2 / systemd config. `node dist/main.js` runs as foreground process. |
| drivers/units/brokerages tables empty | Info | Migration creates tables but seed-demo.ts does not populate them. Manual INSERT or future admin UI needed. |
| No automated E2E tests | Gap | Smoke checklist is manual. Playwright or Cypress recommended for future. |
