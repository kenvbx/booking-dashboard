# Deployment guide

This project is prepared as two deployments:

- **Frontend:** React/Vite static build on Cloudflare Pages.
- **Backend:** Laravel 13 on a PHP-capable host with MySQL, a persistent queue worker, SMTP and HTTPS. Laravel Cloud, Render, Railway, a VPS or managed PHP hosting can provide this layer.

Cloudflare Pages does not run the Laravel PHP API or its queue worker.

## Preflight

Before using a production domain, confirm:

- A MySQL database and a separate production database user exist.
- The backend host supports PHP 8.3+, Composer, Laravel storage, cron/worker processes and HTTPS.
- SMTP credentials and a sender address exist.
- A frontend origin and API origin are chosen, for example `https://booking.example.com` and `https://api.example.com`.
- Database backups, retention, restore testing and a rollback target are defined.
- Demo credentials are removed or disabled before public access.

Do not commit `.env`, API keys, database passwords or real customer data.

## Backend release

1. Provision the host and database. Point `api.example.com` to the backend host and enable TLS.
2. Deploy the repository. Run from `backend/`:

   ```bash
   composer install --no-dev --optimize-autoloader
   cp .env.production.example .env
   php artisan key:generate --force
   # Fill APP_URL, APP_KEY, DB_*, MAIL_* and FRONTEND_URL using the host secret store.
   php artisan migrate --force
   php artisan storage:link
   php artisan optimize
   ```

   `php artisan key:generate` is only for a new environment. Preserve the existing `APP_KEY` on later releases.
3. Run a persistent queue worker:

   ```bash
   php artisan queue:work database --sleep=3 --tries=3 --backoff=60,300,900 --max-time=3600
   ```

   Configure the host supervisor/service manager to restart the worker after deploys and failures. Monitor `failed_jobs`; use `php artisan queue:failed` and `php artisan queue:retry <id>` for recovery.
4. Expose Laravel's built-in health endpoint: `GET /up`. It should return HTTP 200 after the app is booted. Check API CORS with the exact frontend origin.
5. Verify with a non-demo admin account: login, `GET /api/auth/me`, create an appointment, confirm `created_by`, run a conflict rejection, cancel with a reason, and confirm the queue accepts jobs.

Production settings:

- `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.example.com`.
- `APP_TIMEZONE=Asia/Ho_Chi_Minh` to match the current frontend.
- `FRONTEND_URL` must be the exact HTTPS Pages origin; do not use `*`.
- `SESSION_SECURE_COOKIE=true` if browser session cookies are introduced.
- Use a secret manager for `APP_KEY`, DB and SMTP credentials.
- Make `storage/` and `bootstrap/cache/` writable by the application user; do not make the whole project writable.

## Cloudflare Pages release

The repository includes `wrangler.toml`, `public/_redirects` and `public/_headers`.

### Dashboard setup

Create a Pages project connected to the GitHub repository:

- Production branch: `main`.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Node version: `22`.
- Environment variable: `VITE_API_URL=https://api.example.com/api`.

The variable is embedded at build time; trigger a new Pages deployment after changing it. The Vite development proxy is not used in Pages. `public/_redirects` keeps client-side routes on `index.html`; `_headers` adds basic browser security headers.

### CLI alternative

After authenticating Wrangler and selecting the Pages project:

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name booking-dashboard
```

Use the Cloudflare dashboard for custom domain, DNS and TLS. Keep the API on its own origin and allow that frontend origin in Laravel CORS.

## Smoke checklist after deployment

- Open the Pages URL over HTTPS and check no mixed-content or CORS errors.
- Login with a non-demo account.
- Confirm `/up` returns 200 from the API origin.
- Load the current week and verify appointments from both sides of the date range.
- Create, edit, reschedule and cancel an appointment; verify the audit log and `created_by`.
- Confirm a queued confirmation/reminder job is visible and the worker processes it.
- Test a staff account cannot access admin directories or reassign another staff member's appointment.
- Check API logs, failed jobs and database backup status.

## Rollback and recovery

Keep the previous frontend build/deployment available in Cloudflare Pages. For the backend, deploy immutable release revisions and roll back code separately from migrations; never reverse a destructive migration without a verified backup. Before each migration, take a database backup and record the migration batch. If a queue worker fails, keep the API available, inspect failed jobs, fix configuration/code, then restart and retry only safe jobs.

This guide prepares the repository but does not claim that a live frontend, API, DNS record, SMTP transport, queue worker or backup has been configured.
