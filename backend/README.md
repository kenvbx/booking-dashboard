# Helio Booking Dashboard API

Laravel 13 backend for the Helio personal/demo booking dashboard.

## Setup

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The committed `.env.example` is configured for MySQL. The local development `.env` used for this workspace can use SQLite for a zero-setup run.

Seed credentials are demo-only:

- `admin@helio.test` / `password`
- `alex@helio.test` / `password`

## API endpoints

- `GET|POST /api/customers`
- `GET|POST /api/services`
- `GET|POST /api/staff`
- `GET|POST /api/appointments`
- `GET|PUT|DELETE /api/{resource}/{id}`

Authentication endpoints:

- `POST /api/auth/login` with `email`, `password`, and optional `device_name`.
- `GET /api/auth/me` with a `Bearer` token.
- `POST /api/auth/logout` with a `Bearer` token.

Admin-only resources are customers, services, and staff. Admin and staff can access appointments. Protected routes require a Sanctum bearer token.

Appointment creation validates required relationships, time ordering, timezone, and overlapping bookings for the same staff member inside a database transaction.

Appointment status transitions are server-validated: `pending → confirmed/cancelled`, `confirmed → completed/cancelled/rescheduled`, and `rescheduled → pending/confirmed/cancelled`. Cancellation and rescheduling require a reason, and terminal status changes are written to the status history table.

Creating a future appointment queues a confirmation email immediately and a reminder one hour before the start time. Jobs use three attempts with 1/5/15 minute backoff. Run the worker locally with:

```bash
php artisan queue:work --tries=3 --backoff=60,300,900
```

The default local mailer writes messages to `storage/logs/laravel.log`; configure SMTP in `.env` when an actual mail transport is needed.

## Verification

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact
```

This is a personal/demo project. It does not contain production credentials or client data.
