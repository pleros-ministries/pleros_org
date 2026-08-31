"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signOutDashboardAction } from "@/app/_actions/auth-actions";

export function DashboardSignOutButton() {
  return (
    <form action={signOutDashboardAction} className="contents">
      <SignOutSubmitButton />
    </form>
  );
}

function SignOutSubmitButton() {
  const { pending } = useFormStatus();
  const label = pending ? "Signing out" : "Sign out";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/28 bg-white/8 px-3 font-[var(--font-be-vietnam-pro)] [font-size:0.75rem] font-medium text-white transition-[background-color,border-color,opacity] duration-150 hover:border-white/45 hover:bg-white/14 disabled:cursor-wait disabled:opacity-65"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  );
}
