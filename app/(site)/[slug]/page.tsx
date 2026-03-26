import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "../../../components/layout/app-shell";
import { buttonVariants } from "../../../components/ui/button-variants";
import { getPublicSitePage, publicSitePages } from "../../../lib/public-site-pages";
import { cn } from "../../../lib/utils";

type PublicSitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return publicSitePages.map(({ slug }) => ({ slug }));
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { slug } = await params;
  const page = getPublicSitePage(slug);

  if (!page) {
    notFound();
  }

  return (
    <AppShell>
      <section className="section-shell">
        <div className="container-pleros grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start">
          <div className="grid gap-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {page.eyebrow}
            </p>
            <div className="grid gap-4">
              <h1 className="max-w-3xl text-balance text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--color-text-strong)]">
                {page.title}
              </h1>
              <p className="max-w-2xl text-[var(--text-body)] leading-relaxed text-[var(--color-text-muted)]">
                {page.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
              >
                Back to home
              </Link>
              <Link
                href="/ppc"
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
              >
                Enter PPC
              </Link>
            </div>
          </div>

          <aside
            className={cn(
              "rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-[var(--page-accent-surface)] p-6 shadow-[var(--shadow-md)] sm:p-7",
              page.toneClass,
            )}
          >
            <div className="grid gap-4">
              <h2 className="h3 text-[var(--color-text-strong)]">What this page is for</h2>
              <ul className="grid gap-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {page.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="rounded-[var(--radius-lg)] border border-[var(--page-accent-ring)] bg-white/80 px-4 py-3"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
