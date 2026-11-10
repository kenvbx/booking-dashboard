# Helio Booking Dashboard API

Laravel 13 + Sanctum API for a personal/demo project. PHP 8.3+, Composer and a relational database are required. MySQL is the deployment target; PHPUnit uses SQLite.

## Setup

Create the MySQL database `booking_dashboard`, then run from this directory:

```bash
composer install
cp .env.example .env
# Configure DB_* in .env.
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

APP_TIMEZONE defaults to Asia/Ho_Chi_Minh; FRONTEND_URL defaults to http://localhost:5173. Use the exact frontend origin for CORS. Local SQLite setup is described in the root README.

Seed accounts (demo-only): admin@helio.test / password and alex@helio.test / password. Do not use these shared credentials for a private production workspace.

## API contract

| Endpoint | Methods | Access |
|---|---|---|
| /api/auth/login | POST | Public, throttled; email/password, optional device_name |
| /api/auth/me | GET | Authenticated |
| /api/auth/logout | POST | Authenticated; revoke current token |
| /api/customers | GET, POST | Admin |
| /api/services | GET, POST | Admin |
| /api/staff | GET, POST | Admin |
| /api/appointments | GET, POST | Admin/staff, policy scoped |
| /api/{resource}/{id} | GET, PUT/PATCH, DELETE | Same resource permissions |
| /api/dashboard/metrics | GET | Admin/staff; currently workspace-wide |

Authenticated requests use Authorization: Bearer <token> and Accept: application/json. Staff deletion deactivates the profile; appointment deletion cancels with a required JSON reason instead of removing the record.

Appointment listing supports staff_profile_id, status, from, to, page and per_page (default 50, clamped 1–100). Results are ordered by starts_at. from is a lower start boundary; to includes the end of that calendar day in the application timezone and compares ends_at. Appointments must be contained within the range; cross-boundary overlap querying is not implemented. Read pagination metadata to retrieve every page.

Create requires customer_id, staff_profile_id, title, starts_at and ends_at; service_id is nullable. Supported fields include timezone, status, notes and idempotency_key. created_by is always assigned from the authenticated user. Update accepts partial fields; clients changing times should send starts_at and ends_at together for ordering validation.

Staff can only access their own assigned appointments, including after reassignment checks. Admin can reassign. Current directory endpoints remain admin-only, which limits staff frontend forms.

Validation and overlap errors return 422 with field errors; unauthenticated requests return 401 and policy failures 403. Login is limited to five requests/minute per email/IP; authenticated API requests to 120/minute per actor.

## Lifecycle, consistency and audit

Transitions: pending → confirmed/cancelled; confirmed → completed/cancelled/rescheduled; rescheduled → pending/confirmed/cancelled. cancelled/completed are terminal. Changing to cancelled/rescheduled requires status_reason on update; DELETE uses reason. History records status transitions and actor.

Create/time/staff updates check overlap in a transaction after locking the staff profile. MySQL concurrency should be verified separately; SQLite tests do not model its row locks. Create retries with the same idempotency_key return the original appointment, but can still enqueue mail again. Audit logs record important resource mutations.

## Email queue

Creation queues confirmation and a reminder delayed until one hour before starts_at. Jobs have three attempts with [60, 300, 900] second backoff. From this directory:

```bash
php artisan queue:work --tries=3
```

The default mailer writes to storage/logs/laravel.log. Configure SMTP for delivery and a persistent worker on deployment. Jobs skip cancelled appointments and missing email addresses. Changing appointment times does not reschedule existing delayed jobs. See root REQUIREMENTS.md for follow-up work.

## Verification

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact
```

The root Playwright test uses API fixtures, not this server. Latest recorded local PHPUnit result: 22 tests / 88 assertions. Production SMTP, queue recovery, MySQL concurrent writes and full-stack browser workflows still need deployment-level verification.
