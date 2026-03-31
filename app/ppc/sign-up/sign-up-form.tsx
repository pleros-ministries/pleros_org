"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { previewPortalAccess } from "@/app/ppc/_actions/auth-entry-actions";
import {
  formatAuthErrorMessage,
  getPortalAccessNotice,
  getPostAuthRedirectPath,
} from "@/lib/auth-entry";

type SignUpFormProps = {
  returnTo: string;
  initialEmail?: string;
  lockEmail?: boolean;
};

export function SignUpForm({
  returnTo,
  initialEmail = "",
  lockEmail = false,
}: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [portalNotice, setPortalNotice] = useState<{
    tone: "default" | "info" | "warning";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEmailBlur = () => {
    if (!email.trim()) {
      setPortalNotice(null);
      return;
    }

    startTransition(async () => {
      const access = await previewPortalAccess(email);
      if (!access) {
        setPortalNotice(null);
        return;
      }

      setPortalNotice(
        getPortalAccessNotice("student", access.role, "sign_up") as
          | { tone: "default" | "info" | "warning"; message: string }
          | null,
      );
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    startTransition(async () => {
      const access = await previewPortalAccess(email);
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(formatAuthErrorMessage(result.error.message, "sign_up"));
        return;
      }

      router.push(
        getPostAuthRedirectPath({
          resolvedRole: access?.role ?? "student",
          returnTo,
        }),
      );
      router.refresh();
    });
  };

  return (
    <>
      <p className="mt-1 text-xs text-zinc-500">
        {lockEmail
          ? "Create your student account. We already carried your email over from the welcome dashboard."
          : "Create your student account."}
      </p>

      <form onSubmit={handleSignUp} className="mt-4 grid gap-3">
        {error && (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Full name
          </span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="you@example.com"
            readOnly={lockEmail}
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        {portalNotice ? (
          <div
            className={
              portalNotice.tone === "warning"
                ? "rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
                : "rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
            }
          >
            {portalNotice.message}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            minLength={8}
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 h-8 rounded-sm bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/ppc"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Login
        </Link>
      </p>
    </>
  );
}
