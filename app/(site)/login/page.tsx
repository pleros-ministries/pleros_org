import type { Metadata } from "next";

import { AuthGeometryPanel } from "@/components/auth/auth-geometry-panel";
import authCardStyles from "@/components/auth/auth-page-card.module.css";
import { LearnerLoginForm } from "@/components/auth/learner-login-form";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { normalizeLearnerReturnTo } from "@/lib/sogp/auth-flow";

// Cache Components: Reads the request; not adopted yet.
export const instant = false;

export const metadata: Metadata = {
  title: "Log in to Pleros",
  description: "Continue your School of God's Purpose journey.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const returnTo = normalizeLearnerReturnTo(params.returnTo);
  const alreadyEnrolledNotice = params.notice === "already-enrolled";

  return (
    <PublicSitePageShell>
      <main className={`${authCardStyles.pageSurface} site-font-theme min-h-[75vh] bg-[var(--color-brand-sky-soft)] px-4 py-8 sm:px-6 md:py-14`}>
        <section className="mx-auto grid w-full max-w-[64rem] overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[var(--shadow-lg)] lg:grid-cols-[minmax(20rem,0.9fr)_minmax(28rem,1.1fr)]">
          <AuthGeometryPanel className="min-h-[14rem] sm:min-h-[17rem] lg:min-h-[42rem]" />
          <div className={`${authCardStyles.formPane} relative -mt-8 rounded-t-[2rem] bg-white px-6 py-8 sm:px-10 sm:py-10 lg:mt-0 lg:grid lg:place-items-center lg:rounded-none lg:px-12`}>
            <div className="mx-auto w-full max-w-[27rem]">
              <LearnerLoginForm returnTo={returnTo} alreadyEnrolledNotice={alreadyEnrolledNotice} />
            </div>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
