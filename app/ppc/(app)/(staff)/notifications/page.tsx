import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Bell, Mail, MonitorSmartphone } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { PageHeader } from "@/components/ppc/page-header";

export default async function NotificationsPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Notifications"
        description="Reminder policy and notification channels"
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Reminder policy</h3>
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
            <li className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
              First inactivity reminder: <span className="font-medium">2 days</span>
            </li>
            <li className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
              Follow-up cadence: <span className="font-medium">every 2 days</span>
            </li>
            <li className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
              Stop rule: <span className="font-medium">resume activity only</span>
            </li>
            <li className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
              Escalation: <span className="font-medium">instructor notified after 7 days</span>
            </li>
          </ul>
        </article>

        <article className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Channels</h3>
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
            <li className="flex items-center gap-2 rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
              <Mail className="size-3.5 text-zinc-400" />
              Email — transactional and reminder sends
            </li>
            <li className="flex items-center gap-2 rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
              <MonitorSmartphone className="size-3.5 text-zinc-400" />
              Browser web push — real-time alerts
            </li>
          </ul>

          <div className="mt-4">
            <h4 className="text-xs font-medium text-zinc-500">Event triggers</h4>
            <ul className="mt-2 grid gap-1.5 text-xs text-zinc-600">
              <li className="rounded border border-zinc-100 px-3 py-1.5">Submission reviewed (approved / needs revision)</li>
              <li className="rounded border border-zinc-100 px-3 py-1.5">New Q&A reply from staff</li>
              <li className="rounded border border-zinc-100 px-3 py-1.5">Level graduation confirmed</li>
              <li className="rounded border border-zinc-100 px-3 py-1.5">Inactivity reminder triggered</li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
