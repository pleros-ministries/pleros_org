"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { acceptStaffInviteAction } from "@/app/ppc/_actions/staff-invite-actions";
import { authClient } from "@/lib/auth/auth-client";
import { formatAuthErrorMessage } from "@/lib/auth-entry";

type StaffInviteAcceptFormProps = {
  token: string;
  email: string;
  role: string;
};

function roleLabel(role: string) {
  return role === "admin" ? "admin" : "instructor";
}

export function StaffInviteAcceptForm({
  token,
  email,
  role,
}: StaffInviteAcceptFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
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

      try {
        const accepted = await acceptStaffInviteAction({ token });
        router.push(accepted.redirectTo);
        router.refresh();
      } catch (acceptError) {
        setError(
          acceptError instanceof Error
            ? acceptError.message
            : "Invite could not be accepted.",
        );
      }
    });
  };

  return (
    <>
      <div className="mt-4 rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Staff invite
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {email} · {roleLabel(role)}
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
            Full name
          </span>
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            readOnly
            value={email}
            className="h-8 rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-500 outline-none"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Min. 8 characters"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 h-8 rounded-sm bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Setting up..." : "Set password"}
        </button>
      </form>
    </>
  );
}

