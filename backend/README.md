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

Appointment creation validates required relationships, time ordering, timezone, and overlapping bookings for the same staff member inside a database transaction.

## Verification

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact tests/Feature/BookingApiTest.php
```

This is a personal/demo project. It does not contain production credentials or client data.
