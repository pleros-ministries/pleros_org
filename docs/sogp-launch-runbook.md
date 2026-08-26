# SOGP launch runbook

## Routes

- Public: `/sogp`
- Enrolment: `/sogp/enrol`
- Learner: `/dashboard/sogp`
- Admin: `/admin/sogp`
- Telegram webhook: `/api/telegram/sogp/webhook`
- Reminder cron: `/api/cron/sogp-reminders`

Old `school-of-purpose` route files are removed. Do not recreate aliases.

## Required environment

```dotenv
DATABASE_URL=
DATABASE_URL_UNPOOLED=
BETTER_AUTH_SECRET=
NEXT_PUBLIC_APP_URL=https://pleros.org
TELEGRAM_SOGP_BOT_TOKEN=
TELEGRAM_SOGP_BOT_USERNAME=
TELEGRAM_SOGP_CHANNEL_ID=
TELEGRAM_SOGP_CHANNEL_URL=
TELEGRAM_SOGP_WEBHOOK_SECRET=
TELEGRAM_SOGP_LINK_SECRET=
CRON_SECRET=
```

Never commit live values. Rotate bot token if it enters chat, logs, or source control.

## Database

Apply migrations:

```bash
npx drizzle-kit migrate
```

Current additive migration: `drizzle/0009_sogp_platform.sql`.

Formation-tracking migration: `drizzle/0010_sogp_formation_tracking.sql`. Legacy Prayer Watch records become `unspecified`; only explicit `morning` records count toward SOGP.

Birth-year migration: `drizzle/0012_sogp_birth_year.sql` adds the nullable `sogp_enrollments.birth_year` column collected on the enrolment form (applied to the current Neon database on 2026-08-26). Existing rows stay `NULL`; run it before deploying the updated form to any environment that has not had it applied.

Current production data has an enrolment-open `september-2026` cohort. Level 1 and Level 2 provide 16 content-ready tracks. Four named, content-ready Level 3 selections remain required before course activation.

Configure first 20-track curriculum after Level 3 content is ready:

```bash
npm run seed:sogp -- --slug=september-2026 --starts=2026-09-07 --level3=1,2,3,4
```

Replace the four sample numbers with approved Level 3 lesson numbers. Script refuses draft or incomplete tracks.

## Telegram

Bot must be channel administrator with `can_post_messages`. Add a linked discussion group before advertising Telegram as interactive community.

After production route deploys, set webhook:

```bash
curl --request POST "https://api.telegram.org/bot$TELEGRAM_SOGP_BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://pleros.org/api/telegram/sogp/webhook" \
  --data-urlencode "secret_token=$TELEGRAM_SOGP_WEBHOOK_SECRET"
```

Verify with `getWebhookInfo`. Admin `/admin/sogp` can preview and send one-off channel broadcasts. Hobby-compatible daily cron runs at 05:00 UTC (06:00 WAT) and sends deduplicated preparation, newly released track, and next-24-hours live-class messages.

## Launch checklist

1. Confirm `/sogp` and `/sogp/enrol` render on mobile and desktop.
2. Submit one real internal enrolment; verify session, enrolment row, email, dashboard, and Telegram deep link.
3. Add four approved Level 3 tracks and run curriculum seed.
4. Confirm `/admin/sogp` shows `20 / 20` readiness.
5. Add four weekend YouTube live-class records.
6. Link Telegram discussion group; save URL in Cohorts admin.
7. Deploy webhook; start bot from enrolment link; verify identity link and private dashboard reply.
8. Send one admin test broadcast, then delete test message in Telegram.
9. Activate cohort only after readiness alert clears.
10. Verify cron authorization and first reminder checkpoint.
11. Verify learner dashboard shows Morning Prayer Watch and podcast progress links.
12. Verify certificate remains blocked below 80% of cohort mornings or below 28/28 podcast days.

## Verification

```bash
npm run lint
npm test -- lib/sogp lib/telegram/sogp.test.ts lib/telegram/sogp-broadcast.test.ts lib/email/sogp-enrollment.test.ts lib/certificate/sogp-generate.test.ts
npm run build
git diff --check
```

## Safe rollback

1. Change cohort status to `draft` or `archived` in `/admin/sogp`.
2. Remove SOGP cron from `vercel.json` and redeploy.
3. Delete Telegram webhook through Bot API.
4. Leave SOGP tables intact; do not drop enrolments or learner progress.
5. Restore public navigation links only if campaign must pause.
