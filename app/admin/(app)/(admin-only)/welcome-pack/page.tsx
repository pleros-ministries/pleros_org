import { PageHeader } from "@/components/ppc/page-header";
import { StatusBadge } from "@/components/ppc/status-badge";
import { getWelcomePackLeadSummaries } from "@/lib/db/queries/welcome-pack-leads";

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return value.replace("T", " ").slice(0, 16);
}

export default async function AdminWelcomePackPage() {
  const leads = await getWelcomePackLeadSummaries();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Welcome pack leads"
        description={`${leads.length} signup${leads.length === 1 ? "" : "s"}`}
      />

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Lead and unlock state
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Email, source, signup date, Extra gifts, and Shared confirmed state.
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="px-4 py-10 text-sm text-zinc-500">
            No welcome pack leads yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Signup date</th>
                  <th className="px-4 py-3">Extra gifts</th>
                  <th className="px-4 py-3">Shared confirmed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {lead.name ?? "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{lead.source}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={lead.extraGiftsUnlocked ? "unlocked" : "locked"}
                        variant={lead.extraGiftsUnlocked ? "success" : "default"}
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatDate(lead.sharedConfirmedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
