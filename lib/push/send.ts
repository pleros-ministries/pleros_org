import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/push/web-push";

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: (subscription, { eq }) => eq(subscription.userId, userId),
  });

  if (subscriptions.length === 0) {
    return [];
  }

  return Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      ),
    ),
  );
}
