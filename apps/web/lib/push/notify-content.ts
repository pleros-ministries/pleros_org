import { db } from "@/lib/db";
import { isPushEnabled, sendPushNotification } from "@/lib/push/web-push";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pleros.org";

export async function notifyNewContentSubscribers(payload: {
  title: string;
  body: string;
  path: string;
}) {
  if (!isPushEnabled()) return [];

  const subscriptions = await db.query.siteWebPushSubscriptions.findMany({
    where: (subscription, { eq }) => eq(subscription.newContentEnabled, true),
  });

  if (subscriptions.length === 0) return [];

  return Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        {
          title: payload.title,
          body: payload.body,
          url: `${SITE_URL}${payload.path}`,
        },
      ),
    ),
  );
}

export async function notifyPrayerWatchSubscribers(payload: {
  title: string;
  body: string;
  path: string;
}) {
  if (!isPushEnabled()) return [];

  const subscriptions = await db.query.siteWebPushSubscriptions.findMany({
    where: (subscription, { eq }) => eq(subscription.prayerWatchEnabled, true),
  });

  if (subscriptions.length === 0) return [];

  return Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        {
          title: payload.title,
          body: payload.body,
          url: `${SITE_URL}${payload.path}`,
        },
      ),
    ),
  );
}
