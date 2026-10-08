import { db } from "@/lib/db";
import {
  deletePushSubscriptions,
  isCommunityPushAllowed,
} from "@/lib/db/queries/notification-preferences";
import { isPushEnabled, sendPushNotification } from "@/lib/push/web-push";

export type PushPayload = { title: string; body: string; url?: string };

export type PushTarget = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushDeliveryResult = {
  delivered: number;
  /** Subscriptions the push service reported as gone, now deleted. */
  pruned: number;
  failed: number;
};

/**
 * Which learner preference a push must respect.
 *
 * - `community`: messages, replies, discipleship, Ask Pleros and Pleros
 *   updates. Skipped when the learner switched those off (no saved row means
 *   they are on).
 * - `none`: sent regardless. Use it for staff pushes, and where the caller has
 *   already applied the learner's preferences (scheduled reminders, or a
 *   fan-out filtered with `listUsersWithCommunityPushOff`).
 */
export type PushGate = "community" | "none";

function nothingSent(): PushDeliveryResult {
  return { delivered: 0, pruned: 0, failed: 0 };
}

/**
 * Sends one payload to a known set of devices and deletes any the push service
 * says no longer exist (404 or 410), so dead endpoints are not retried.
 */
export async function sendPushToSubscriptions(
  subscriptions: PushTarget[],
  payload: PushPayload,
): Promise<PushDeliveryResult> {
  if (!isPushEnabled() || subscriptions.length === 0) return nothingSent();

  const settled = await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
      ),
    ),
  );

  const result = nothingSent();
  const gone: number[] = [];
  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      result.delivered += 1;
      return;
    }
    const statusCode = (outcome.reason as { statusCode?: unknown } | null)
      ?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      gone.push(subscriptions[index]!.id);
    } else {
      result.failed += 1;
    }
  });

  if (gone.length > 0) {
    try {
      await deletePushSubscriptions(gone);
      result.pruned = gone.length;
    } catch (error) {
      console.error("Could not remove expired push subscriptions:", error);
    }
  }

  return result;
}

/**
 * Sends a push to every device a user has turned notifications on for. The
 * `gate` is required so each caller states which preference applies.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  options: { gate: PushGate },
): Promise<PushDeliveryResult> {
  if (!isPushEnabled()) return nothingSent();

  if (options.gate === "community" && !(await isCommunityPushAllowed(userId))) {
    return nothingSent();
  }

  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: (subscription, { eq }) => eq(subscription.userId, userId),
  });

  return sendPushToSubscriptions(subscriptions, payload);
}
