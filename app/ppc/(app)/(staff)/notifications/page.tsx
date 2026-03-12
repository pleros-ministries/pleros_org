import { DEMO_NOTIFICATIONS, formatShortDate } from "@/lib/ppc-demo";

export default function PpcNotificationsPage() {
  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Notifications</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Immediate email and web push events with inactivity reminder cadence.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Recent sends</h3>
          <div className="mt-3 grid gap-2">
            {DEMO_NOTIFICATIONS.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.event}</p>
                  <p className="text-xs text-zinc-600">{item.recipient}</p>
                </div>
                <div className="text-right text-xs text-zinc-600">
                  <p>{item.channel === "web_push" ? "Web push" : "Email"}</p>
                  <p>{formatShortDate(item.sentAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Reminder policy</h3>
          <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
            <li className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              First inactivity reminder: 2 days
            </li>
            <li className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              Follow-up cadence: every 2 days
            </li>
            <li className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              Stop rule: resume activity only
            </li>
            <li className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              Channels: Email + Browser Web Push
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
