import type { Metadata } from "next";

import { LearnerLoginForm } from "@/components/auth/learner-login-form";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { normalizeLearnerReturnTo } from "@/lib/sogp/auth-flow";

export const metadata: Metadata = {
  title: "Log in to Pleros",
  description: "Continue your School of God's Purpose journey.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = normalizeLearnerReturnTo(params.returnTo);

  return (
    <PublicSitePageShell>
      <main className="site-font-theme min-h-[75vh] bg-[var(--color-surface-muted)] py-10 md:py-16">
        <section className="site-shell-page sogp-shell-page grid place-items-center">
          <div className="w-full max-w-[32rem] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <LearnerLoginForm returnTo={returnTo} />
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
