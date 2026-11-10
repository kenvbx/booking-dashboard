# Helio Booking Dashboard

Helio is a personal/demo appointment operations dashboard built with React (JavaScript/JSX), Vite, Lucide React, CSS, and a Laravel 13 REST API with Sanctum. MySQL is the target database; PHPUnit uses SQLite.

This is a **Personal Project / Demo Project**, not client work. There are no verified production usage, revenue, or performance claims.

## Implemented

- Sign in/out with Sanctum bearer tokens and admin/staff authorization.
- Current-week calendar, Monday–Sunday, using `Asia/Ho_Chi_Minh`; date and staff/status filters, with all API pages fetched for the visible range.
- Create and edit appointments by clicking a calendar card; change customer, service, assigned staff, date, and start time; cancel with a reason.
- API-backed metrics: total bookings and completion rate across all records, active bookings today, customers created this month.
- Admin CRUD APIs for customers, services, and staff; staff deactivation.
- Appointment overlap checks in transactions, staff-row locking, create idempotency keys, creator attribution, status history, and audit logs.
- Queued confirmation/reminder emails, rate limiting, CORS configuration, PHPUnit coverage, and a Playwright browser smoke test.

## Local setup

Prerequisites: Node.js 22 (CI baseline), PHP 8.3+, Composer, and MySQL. Create the `booking_dashboard` database first.

From the repository root:

```bash
npm ci
cp .env.example .env
```

Initialize the API:

```bash
cd backend
composer install
cp .env.example .env
# Set database connection values in .env.
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Seeded accounts are demo-only: `admin@helio.test` / `password` and `alex@helio.test` / `password`. Use the admin account for the complete current frontend creation/edit flow; staff directory access remains limited as described below.

In another terminal, from the repository root:

```bash
npm run dev
```

Open the URL printed by Vite. The development server proxies `/api` to `http://127.0.0.1:8000`. `VITE_API_URL` defaults to `/api`; when using an externally hosted API, set it to an absolute URL ending in `/api` before building.

For local SQLite, set `DB_CONNECTION=sqlite`, remove `DB_DATABASE` so Laravel uses its default path (or set an absolute SQLite file path), create `backend/database/database.sqlite`, then run migrations. SQLite is useful for local work/tests; it does not verify MySQL concurrency guarantees.

Run a worker from `backend/` for queued mail:

```bash
php artisan queue:work --tries=3
```

The default mailer writes mail to `backend/storage/logs/laravel.log`. Configure SMTP for actual delivery. Backend `APP_TIMEZONE` defaults to `Asia/Ho_Chi_Minh`; the frontend currently uses this fixed timezone too. Restart workers and clear/rebuild configuration caches after environment changes.

## Verification

From the repository root:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

From `backend/`:

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact
```

Latest local checks recorded during implementation: 22 PHPUnit tests / 88 assertions, one Playwright smoke test, and a successful frontend build. These are local results, not confirmation of the latest remote CI run.

Playwright covers login → workspace → create appointment → calendar display using browser-level API fixtures. It does **not** exercise a real Laravel server, database, or mail transport. Edit/cancel browser coverage and a full-stack smoke test remain follow-up work.

GitHub Actions (`.github/workflows/ci.yml`) runs frontend build and Playwright Chromium, plus backend PHPUnit with PHP 8.3 and SQLite, on pushes/PRs to `main`.

## Known limitations

- Customers, Services, and Team have APIs but no dedicated management screens. Some navigation/actions are placeholders.
- Customer/service/staff directory endpoints are admin-only. Staff can access their appointments through the API, but the current frontend cannot populate the creation/edit directories for staff accounts. The mocked browser test does not verify this permission boundary.
- Frontend edits date/time without changing lifecycle status to `rescheduled`; edit duration is currently fixed at 45 minutes. No lifecycle-status selector is implemented.
- The calendar is the current week only, with an 08:00–16:00 time grid. It does not yet offer week navigation or robust out-of-hours/overlap layout.
- Tokens are stored in localStorage. Demo credentials are displayed on login. A public deployment needs an explicit demo-access strategy.
- Reminder jobs are scheduled on creation; changing the appointment time does not reschedule an existing queued reminder. Repeated idempotent create requests can dispatch duplicate email jobs.
- Metrics are workspace-wide, including for staff sessions. Production monitoring, backup/restore, and full-stack deployment checks are pending.

## Deployment direction

The React build (`npm run build`, output `dist/`) can be hosted on Cloudflare Pages. Laravel needs a separate PHP-capable host with MySQL, a persistent queue worker, SMTP, writable storage, and HTTPS. Set `VITE_API_URL` for that backend and `FRONTEND_URL` on Laravel for the exact frontend origin. Vite's development proxy is not part of the production build.

Deployment configuration, backup/rollback procedures, and live environment verification are still pending. This repository is not documented as already deployed.

## Project documents

- [Product brief](PRODUCT_BRIEF.md)
- [Requirements and backlog](REQUIREMENTS.md)
- [Architecture and trade-offs](ARCHITECTURE.md)
- [API setup and contract](backend/README.md)
- [Deployment guide](DEPLOYMENT.md)
