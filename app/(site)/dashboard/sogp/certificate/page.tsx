import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Download } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";

export default async function SogpCertificatePage() {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enroll");
  const data = await getSogpDashboardData(session.user.id);
  if (!data?.certificate || data.certificate.revokedAt) redirect("/dashboard/sogp");
  return <section className="site-shell-page sogp-shell-page grid min-h-[60vh] place-items-center py-16"><div className="grid max-w-xl justify-items-center gap-5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-8 text-center shadow-[var(--shadow-md)]"><span className="grid size-16 place-items-center rounded-full bg-[var(--color-brand-lime)]"><Award className="size-8 text-[var(--color-brand-blue)]"/></span><div className="grid gap-2"><p className="site-hero-eyebrow justify-center">School of God&apos;s Purpose</p><h1 className="site-section-heading text-3xl">Your certificate is ready</h1><p className="text-sm leading-[1.5] text-[var(--color-text-muted)]">Celebrate your completion and keep your digital certificate.</p></div><a href={`/api/sogp/certificate/${data.certificate.verificationCode}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white"><Download className="size-4"/> Download certificate</a><Link href="/dashboard/sogp" className="text-xs font-semibold text-[var(--color-text-muted)]">Back to SOGP</Link></div></section>;
}
