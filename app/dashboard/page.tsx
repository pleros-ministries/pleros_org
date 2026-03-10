import Link from "next/link";

import { DASHBOARD_CARDS, getGreetingName } from "@/lib/welcome-flow";

type DashboardProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const name = getGreetingName(params.email);
  const [featuredCard, ...regularCards] = DASHBOARD_CARDS;

  return (
    <main className="ambient-bg min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line/80 bg-surface/90 p-4 shadow-[0_30px_90px_-58px_rgba(0,0,0,.46)] sm:p-7">
        <header className="border-b border-line/80 pb-5">
          <p className="font-display text-[0.73rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Pleros Dashboard
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2.35rem]">
            Welcome, {name}
          </h1>
        </header>

        {featuredCard ? (
          <section className="mt-6">
            <article className="card-surface rounded-3xl border border-line/85 p-5 sm:p-6">
              <h2 className="font-display text-[1.7rem] leading-tight font-semibold text-foreground">
                {featuredCard.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                {featuredCard.description}
              </p>
            </article>
          </section>
        ) : null}

        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {regularCards.map((card) => {
            const cardContent = (
              <>
                <h3 className="font-display text-[1.45rem] leading-tight font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{card.description}</p>
                <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Open
                </span>
              </>
            );

            if (card.href === "#") {
              return (
                <article
                  key={card.title}
                  className="card-surface rounded-3xl border border-line/85 p-5"
                >
                  {cardContent}
                </article>
              );
            }

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group card-surface block rounded-3xl border border-line/85 p-5 transition hover:-translate-y-1"
              >
                {cardContent}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
