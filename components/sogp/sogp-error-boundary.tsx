"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class SogpErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SOGP dashboard error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <section className="site-shell-page py-16">
          <div className="grid max-w-xl gap-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-6">
            <h1 className="site-section-heading text-2xl text-red-950">Your SOGP dashboard could not load</h1>
            <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.5] text-red-800">Refresh the page. If this continues, contact the SOGP team.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-2 min-h-11 w-fit rounded-full bg-red-900 px-5 text-sm font-semibold text-white">Refresh dashboard</button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
