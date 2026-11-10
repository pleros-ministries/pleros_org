import { PageHeader } from "@/components/ppc/page-header";
import { StatusBadge } from "@/components/ppc/status-badge";
import { requireAdmin } from "@/lib/auth/require-role";
import { listAllPartnerGifts } from "@/lib/db/queries/partner-gifts";
import { formatGiftAmount, giftChannelLabels, yearTotals } from "@/lib/partner-gifts";

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * Giving (user, 10 November): what givers report from the dashboard Partner
 * tab, and online gifts Paystack confirmed while they were logged in. Admins
 * only; givers never see this list.
 */
export default async function AdminGivingPage() {
  await requireAdmin();
  const gifts = await listAllPartnerGifts();
  const totals = yearTotals(gifts);
  const summary = [
    `${gifts.length} gift${gifts.length === 1 ? "" : "s"}`,
    totals.length ? `This year ${totals.map(total => formatGiftAmount(total.amountMinor, total.currency)).join(" · ")}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="grid gap-6">
      <PageHeader title="Giving" description={summary} />

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-medium text-zinc-900">Reported and online gifts</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Reported gifts are what givers tell us; check them against the bank statement. Online gifts were confirmed by Paystack.
          </p>
        </div>

        {gifts.length === 0 ? (
          <div className="px-4 py-10 text-sm text-zinc-500">
            No gifts yet. Gifts appear here when someone reports giving on the dashboard Partner tab, or gives online while logged in.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Giver</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">How</th>
                  <th className="px-4 py-3">Day given</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {gifts.map((gift) => (
                  <tr key={gift.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{gift.name}</div>
                      <div className="text-xs text-zinc-500">{gift.email}</div>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-zinc-900">
                      {formatGiftAmount(gift.amountMinor, gift.currency)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{giftChannelLabels[gift.channel]}</td>
                    <td className="px-4 py-3 text-zinc-600">{formatDay(gift.givenOn)}</td>
                    <td className="px-4 py-3 text-zinc-600">{gift.note ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={gift.online ? "Paystack" : "Reported"}
                        variant={gift.online ? "success" : "default"}
                      />
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
