"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

type StaffRoleTab = "admin" | "instructor";

const tabCopy: Record<
  StaffRoleTab,
  { eyebrow: string; description: string }
> = {
  admin: {
    eyebrow: "Administrator access",
    description: "Platform oversight, content publishing, and team controls.",
  },
  instructor: {
    eyebrow: "Instructor access",
    description: "Review queue, student support, and Q&A moderation.",
  },
};

export function StaffLoginPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StaffRoleTab>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const googleEnabled =
    typeof process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "undefined";

  const handleEmailSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
    });
  };

  return (
    <>
      <div className="mt-4 grid gap-2">
        <div className="inline-flex rounded-sm border border-zinc-200 bg-zinc-50 p-1">
          {(["admin", "instructor"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-8 rounded-sm px-3 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {tab === "admin" ? "Admin" : "Instructor"}
            </button>
          ))}
        </div>

        <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {tabCopy[activeTab].eyebrow}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {tabCopy[activeTab].description}
          </p>
        </div>
      </div>

      <form onSubmit={handleEmailSignIn} className="mt-4 grid gap-3">
        {error ? (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 h-8 rounded-sm bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Logging in..." : "Login"}
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-[10px] uppercase text-zinc-400">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isPending}
            className="flex h-8 w-full items-center justify-center gap-2 rounded-sm border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <svg className="size-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </>
      ) : null}
    </>
  );
}
