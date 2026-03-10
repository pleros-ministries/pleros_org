"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { buildDashboardHref, validateEmail } from "@/lib/welcome-flow";

export function LandingExperience() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const hasError = useMemo(() => {
    if (!attemptedSubmit) {
      return false;
    }

    return !validateEmail(email);
  }, [attemptedSubmit, email]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (!validateEmail(email)) {
      return;
    }

    router.push(buildDashboardHref(email));
  }

  return (
    <div className="ambient-bg relative min-h-screen overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center rounded-[2rem] border border-line/70 bg-white/40 p-6 backdrop-blur-sm sm:p-10">
        <section className="w-full rounded-[1.8rem] border border-line/85 bg-surface/80 px-5 pb-7 pt-8 shadow-[0_30px_85px_-55px_rgba(0,0,0,.55)] sm:px-9 sm:pb-10 sm:pt-10">
          <p className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted">
            Pleros Website
          </p>

          <div className="mt-7 grid gap-7 md:grid-cols-[1.35fr_1fr] md:items-end">
            <div className="max-w-xl">
              <h1 className="font-display text-4xl leading-[1.03] font-semibold text-foreground sm:text-5xl md:text-[3.45rem]">
                Rooted prayer.
                <br />
                Shared mission.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                Step into the Pleros community dashboard to access your Welcome
                Pack, partnership pathways, and devotional resources.
              </p>
            </div>

            <div className="hidden rounded-3xl border border-line/90 bg-white/80 p-5 md:block">
              <p className="font-display text-2xl text-foreground">
                Welcome, Daniel
              </p>
              <p className="mt-2 text-sm text-muted">
                Your personal dashboard opens right after email confirmation.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-0 z-20 bg-[rgb(18_19_17/.42)] backdrop-blur-[2px]" />

      <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center px-4">
        <section className="card-surface animate-modal-enter pointer-events-auto w-full max-w-md rounded-[1.45rem] border border-line/90 p-4 sm:p-5">
          <div className="rounded-[1.2rem] border-2 border-dashed border-line/80 px-4 py-5 sm:px-5 sm:py-6">
            <p className="text-center font-display text-[0.72rem] font-semibold uppercase tracking-[0.23em] text-muted">
              Modal
            </p>
            <h2 className="mt-3 text-center font-display text-[1.75rem] leading-tight font-semibold text-foreground sm:text-[2.08rem]">
              Receive the Pleros Welcome Pack
            </h2>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit} noValidate>
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-foreground outline-none transition focus:border-foreground/45 focus:ring-2 focus:ring-foreground/15"
                aria-invalid={hasError}
                aria-describedby={hasError ? "email-error" : undefined}
              />

              {hasError ? (
                <p id="email-error" className="text-xs text-[#9c3e34]">
                  Please enter a valid email address.
                </p>
              ) : null}

              <button
                type="submit"
                className="h-12 w-full rounded-xl border border-accent/80 bg-accent font-semibold tracking-[0.02em] text-accent-ink transition hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0"
              >
                GET WELCOME PACK
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
