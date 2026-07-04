import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  MonitorSmartphone,
} from "lucide-react";

import { PageHeader } from "@/components/ppc/page-header";
import { PushSubscriptionPanel } from "@/components/ppc/push-subscription-panel";
import { getPpcNotificationStatus } from "@/lib/ppc-notifications";
import { cn } from "@/lib/utils";

const channelIcons = {
  email: Mail,
  push: MonitorSmartphone,
  cron: Clock3,
};

const eventRows = [
  {
    label: "Review assignment",
    channel: "Email + push",
    state: "wired",
    detail: "Sent when a staff member assigns a review item to another staff member.",
  },
  {
    label: "Q&A assignment",
    channel: "Email + push",
    state: "wired",
    detail: "Sent when a staff member assigns a Q&A thread to another staff member.",
  },
  {
    label: "Submission reviewed",
    channel: "Email",
    state: "wired",
    detail: "Sent to students after approval or revision request.",
  },
  {
    label: "Graduation confirmed",
    channel: "Email",
    state: "wired",
    detail: "Sent to students when staff confirms level graduation.",
  },
  {
    label: "Inactivity reminder",
    channel: "Email",
    state: "cron",
    detail: "Sent by the inactivity-reminders cron endpoint.",
  },
];

function statusClasses(state: "ready" | "warning" | "blocked") {
  if (state === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
}

function StatusIcon({ state }: { state: "ready" | "warning" | "blocked" }) {
  if (state === "ready") {
    return <CheckCircle2 className="size-3.5" />;
  }

  return <AlertCircle className="size-3.5" />;
}

export default function AdminNotificationsPage() {
  const status = getPpcNotificationStatus({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
  const pushStatus = status.channels.find((channel) => channel.id === "push");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Notifications"
        description="Operational status for PPC email, push alerts, and reminder policy"
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            Ready
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {status.summary.ready}
          </p>
        </div>
        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            Warnings
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {status.summary.warning}
          </p>
        </div>
        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            Blocked
          </p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">
            {status.summary.blocked}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-zinc-500" />
            <div>
              <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
                System status
              </h3>
              <p className="text-[11px] text-zinc-500">
                {status.summary.headline}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {status.channels.map((channel) => {
              const Icon = channelIcons[channel.id];

              return (
                <div
                  key={channel.id}
                  className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 size-3.5 text-zinc-400" />
                      <div>
                        <p className="text-xs font-medium text-zinc-900">
                          {channel.label}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {channel.detail}
                        </p>
                        {channel.missing.length > 0 ? (
                          <p className="mt-1 text-[11px] text-rose-700">
                            Missing: {channel.missing.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                        statusClasses(channel.state),
                      )}
                    >
                      <StatusIcon state={channel.state} />
                      {channel.state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <PushSubscriptionPanel isPushConfigured={pushStatus?.state === "ready"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-zinc-500" />
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Event readiness
            </h3>
          </div>

          <div className="mt-3 grid gap-2">
            {status.events.map((event) => (
              <div
                key={event.id}
                className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-900">
                      {event.label}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {event.detail}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                      statusClasses(event.state),
                    )}
                  >
                    <StatusIcon state={event.state} />
                    {event.state}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-zinc-500" />
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Wired triggers
            </h3>
          </div>

          <div className="mt-3 grid gap-2">
            {eventRows.map((event) => (
              <div
                key={event.label}
                className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-900">
                      {event.label}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {event.detail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    {event.channel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
