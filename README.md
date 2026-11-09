# Helio Booking Dashboard

Helio is a personal/demo booking operations dashboard for managing appointment schedules, staff availability, customers, and booking status from one workspace. It is designed as a portfolio project that demonstrates a practical Laravel + React/TypeScript product direction.

This repository is a **Personal Project / Demo Project**. It is not client work and contains no production usage or performance claims.

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

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
