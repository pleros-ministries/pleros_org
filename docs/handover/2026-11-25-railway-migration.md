# Moving Pleros from Vercel to Railway (25 November 2026)

## Why

The October Vercel invoice was $59.30. $40 of that was fixed fees (Pro $20, Flat Rate CDN $20). The rest came mostly from builds (4,396 build minutes, $9.29) and logging (9.9M observability events, $4.28). The app itself, for about 60 active people, cost about $6 to run.

Production then (measured 25 November): Postgres 33 MB on Neon, 552 accounts, 117 active in 30 days and 36 in 7 days.

## What changed in the code

- **`proxy.ts`:** the matcher now covers pages only. It used to run on every JS chunk, font, image and API call, which was most of the 2.4M function invocations.
- **`lib/db/index.ts`:** uses one long-lived `pg` pool (`drizzle-orm/node-postgres`) instead of Neon's HTTP driver. Raw `db.execute()` still returns `{ rows }`, so callers are unchanged. `lib/db/transaction.ts` re-exports the same `db`, because node-postgres supports transactions directly. `DATABASE_POOL_MAX` sets the pool size (default 10).
- **`next.config.ts`:** `output: "standalone"`.
- **`Dockerfile`, `.dockerignore`, `railway.json`:** Railway builds the Dockerfile and deploys only on changes to app paths.
  - The build uses `DATABASE_PUBLIC_URL` when set, because the private database host isn't reachable during builds.
  - Every variable the build needs must be declared as an `ARG` in the Dockerfile.

## Railway layout (project in EU West, closest to Nigeria)

| Service | What it is |
|---|---|
| `Postgres` | Railway Postgres 17 with a volume. The app reaches it at `postgres.railway.internal`. |
| `web` | This repo, `main` branch only. No PR environments. |
| `cron-reminders` | Image `alpine:3.20`, schedule `*/5 * * * *`, start command `sh -c 'wget -qO- -T 290 --header="Authorization: Bearer $CRON_SECRET" http://web.railway.internal:3000/api/cron/reminder-dispatch'`, variable `CRON_SECRET=${{web.CRON_SECRET}}` |
| `cron-daily` | Same, schedule `20 4 * * *` (05:20 in Lagos), path `/api/cron/sogp-reminders` |

Usage limits are a $20 hard limit and a $15 email alert, under Workspace → Usage.

## Variables on `web`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private) and `DATABASE_PUBLIC_URL=${{Postgres.DATABASE_PUBLIC_URL}}` (for builds only).
- Everything else is copied from Vercel's production environment (`vercel env pull`, then Railway's Raw Editor).
- Drop the Neon-only `PG*`, `POSTGRES_*` and `DATABASE_URL_UNPOOLED`.

## Copying the database

```bash
pg_dump "$NEON_UNPOOLED_URL" --no-owner --no-acl -Fc -f pleros.dump
pg_restore --no-owner --no-acl -d "$RAILWAY_PUBLIC_URL" pleros.dump
```

Then compare row counts table by table, including `drizzle.__drizzle_migrations`. For the final cutover, stop writes first (pause the Vercel deployment), dump again and restore into a fresh database.

## What happened at cutover (25 November, about 08:00 UTC)

- Final dump at 07:56 UTC. DNS switched in Cloudflare at about 08:04: `pleros.org` and `www.pleros.org` are DNS-only CNAMEs to Railway, with Railway's `_railway-verify` TXT records. Let's Encrypt certificates were issued within minutes. The email records (Resend, SES, DMARC) are unchanged.
- Railway serves both hosts directly. The old Vercel redirect from `pleros.org` to `www` is gone; auth trusts both origins. The Telegram webhook (`https://pleros.org/api/telegram/sogp/webhook`) needed no change.
- Railway injects `PORT=8080`. The service sets `PORT=3000` to match its domains.
- **Vercel's cron jobs had silently stopped around 18 November**, so no reminders, Prayer Watch pushes or daily digests went out for a week. Railway's cron services restored them.
- **Removing a cron service's deployment doesn't stop its schedule.** Railway starts a fresh run from the latest image on every tick. To pause a cron, remove its schedule or delete the service and apply the change.
- A test run at 07:50 UTC and a run during the restore at 08:00 UTC each sent the same new-podcast alert, so up to 8 members got it twice. Nothing else was duplicated.
- Sessions created on Neon between the final dump and the DNS switch (three) were lost; those people sign in again.

## Cutover checklist

1. Railway URL works: sign-in (email and Google), the dashboard, a report save, an upload and a Paystack test.
2. Add `pleros.org` and `ppc.pleros.org` as custom domains on `web`, then point the Cloudflare DNS records at Railway's targets (DNS only, not proxied, until certificates issue).
3. Add the Railway domain to Google OAuth's redirect URIs only if a non-`pleros.org` URL is used for testing.
4. Re-point the Telegram webhook if it uses a hostname other than `pleros.org`.
5. Pause the Vercel project. In a follow-up PR, delete `vercel.json` and the `process.env.VERCEL` check in `next.config.ts`.
6. Keep Neon read-only for two weeks as a fallback, then delete it.
