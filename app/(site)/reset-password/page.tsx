import type { Metadata } from "next";

import { LearnerPasswordRecovery } from "@/components/auth/learner-password-recovery";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";

export const metadata: Metadata = { title: "Set your password" };

export default function ResetPasswordPage() {
  return (
    <PublicSitePageShell>
      <main className="site-font-theme min-h-[75vh] bg-[var(--color-surface-muted)] py-10 md:py-16">
        <section className="site-shell-page sogp-shell-page grid place-items-center">
          <div className="w-full max-w-[32rem] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <LearnerPasswordRecovery initialMode="reset" />
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
