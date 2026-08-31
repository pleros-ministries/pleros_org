import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { SogpSetupForm } from "@/components/sogp/sogp-setup-form";
import { getPendingSogpEnrollmentByTokenHash } from "@/lib/db/queries/sogp";
import {
  SOGP_SETUP_COOKIE,
  getSogpFlowSecret,
  hashSogpFlowToken,
  isSogpSetupExpired,
  maskEmail,
} from "@/lib/sogp/auth-flow";

export const metadata: Metadata = {
  title: "Set up your SOGP account",
  description: "Verify your email and create your SOGP password.",
};

export default async function SetupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SOGP_SETUP_COOKIE)?.value;
  if (!token) redirect("/signup");

  const pending = await getPendingSogpEnrollmentByTokenHash(
    hashSogpFlowToken(token, getSogpFlowSecret(process.env)),
  );
  if (!pending || isSogpSetupExpired(pending.expiresAt) || pending.completedAt) {
    redirect("/signup");
  }

  return (
    <PublicSitePageShell>
      <main className="site-font-theme min-h-[75vh] bg-[var(--color-surface-muted)] py-10 md:py-16">
        <section className="site-shell-page sogp-shell-page grid place-items-center">
          <div className="w-full max-w-[32rem] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <SogpSetupForm
              maskedEmail={maskEmail(pending.email)}
              initialStep={pending.verifiedAt ? "password" : "verify"}
            />
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
