import { PageHeader } from "@/components/ppc/page-header";
import { getSchoolOfPurposeWaitlistEntries } from "@/lib/db/queries/school-of-purpose-waitlist";

function formatDate(value: Date) {
  return value.toISOString().replace("T", " ").slice(0, 16);
}

export default async function AdminSchoolOfPurposePage() {
  const entries = await getSchoolOfPurposeWaitlistEntries();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="School of Purpose waitlist"
        description={`${entries.length} signup${entries.length === 1 ? "" : "s"}`}
      />

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Name, WhatsApp number, email, and signup date
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Collected from signed-in visitors on the dashboard.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-10 text-sm text-zinc-500">
            No waitlist signups yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">WhatsApp number</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Signup date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {entry.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{entry.phone}</td>
                    <td className="px-4 py-3 text-zinc-600">{entry.email}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatDate(entry.createdAt)}
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
