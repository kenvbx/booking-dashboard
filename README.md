# Helio Booking Dashboard

Helio is a personal/demo booking operations dashboard for managing appointment schedules, staff availability, customers, and booking status from one workspace. It is designed as a portfolio project that demonstrates a practical Laravel + React/TypeScript product direction.

This repository is a **Personal Project / Demo Project**. It is not client work and contains no production usage or performance claims.

## Run locally

```bash
npm install
npm run dev
```

Start the API in another terminal:

```bash
cd backend
php artisan serve
```

Then open the Vite URL shown in the terminal. The Vite dev server proxies `/api` to `http://127.0.0.1:8000`; set `VITE_API_URL` in `.env` when the API is hosted elsewhere.

## Current demo slice

- Dark operations dashboard with responsive layout.
- Week calendar with status/staff filters.
- Quick-create appointment modal and confirmation toast.
- Demo metrics, today agenda and operational insight card.

## Product highlights

- Week calendar with clear confirmed, pending, and cancelled states.
- Staff and status filters for fast schedule triage.
- Quick-create appointment flow with conflict-check messaging.
- Responsive dark operations UI with keyboard focus states and reduced-motion support.
- Product brief, requirements, and architecture notes for the planned backend slices.

## Tech used in this slice

- React
- Vite
- Lucide React
- CSS with a documented dashboard design system

## Backend status

The first backend slice is available in `backend/`:

- Laravel 13 modular monolith with MySQL-ready configuration.
- REST API resources for customers, services, staff, and appointments.
- Migrations for appointment status history and audit-log foundations.
- Demo factories and seed data.
- Transactional appointment creation with server-side overlap validation.
- Sanctum token authentication with `admin` and `staff` role middleware.
- Queue-based confirmation and one-hour reminder email jobs with retry backoff.
- React login and Sanctum bearer-token flow connected to the Laravel API.
- API-backed appointment calendar, customer/staff directory, filters, and create flow.
- API-backed dashboard metrics for bookings, today’s schedule, completion rate, and monthly customers.
- PHPUnit feature coverage for appointment creation, conflicts, and customer validation.

Run the backend locally:

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The local test environment uses SQLite. For MySQL, create `booking_dashboard`, copy the MySQL values from `.env.example`, and run the same migrations.

## End-to-end smoke test

The Playwright smoke test covers the primary browser workflow: sign in, load the workspace, create an appointment, and verify it appears on the calendar.

```bash
npx playwright install chromium
npm run test:e2e
```

The test uses browser-level API fixtures so it is deterministic and does not require a running Laravel server.

## Continuous integration

GitHub Actions runs on pushes and pull requests to `main`:

- Frontend: `npm ci` and `npm run build`.
- Backend: PHP 8.3, Composer install, SQLite migrations through the test suite, and all PHPUnit tests.

The workflow is defined in `.github/workflows/ci.yml`.
