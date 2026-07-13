"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { formatAuthErrorMessage } from "@/lib/auth-entry";

type SuperAdminSetupFormProps = {
  emails: string[];
};

export function SuperAdminSetupForm({ emails }: SuperAdminSetupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(emails[0] ?? "");
  const [name, setName] = useState("FCC Ibadan");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(formatAuthErrorMessage(result.error.message, "sign_up"));
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <>
      <div className="mt-4 rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Bootstrap account
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          This creates a configured PPC super admin account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        {error ? (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Display name
          </span>
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Email
          </span>
          <select
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-8 rounded-sm border border-zinc-300 bg-white px-2.5 text-xs text-zinc-700 outline-none focus:border-zinc-700"
          >
            {emails.map((configuredEmail) => (
              <option key={configuredEmail} value={configuredEmail}>
                {configuredEmail}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Min. 8 characters"
              className="h-8 w-full rounded-sm border border-zinc-300 px-2.5 pr-9 text-xs outline-none focus:border-zinc-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)] disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create super admin"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        Already created this account?{" "}
        <Link
          href="/admin"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Login
        </Link>
        .
      </p>
    </>
  );
}
