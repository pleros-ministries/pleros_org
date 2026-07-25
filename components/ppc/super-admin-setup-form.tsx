"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import {
  createSuperAdminAccountAction,
  type SuperAdminSetupState,
} from "@/app/admin/setup/actions";

const initialState: SuperAdminSetupState = {
  status: "idle",
  message: "",
  values: {
    name: "",
    email: "",
  },
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)] disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send setup email"}
    </button>
  );
}

export function SuperAdminSetupForm() {
  const [state, formAction] = useActionState(
    createSuperAdminAccountAction,
    initialState,
  );

  return (
    <>
      <div className="mt-4 rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Bootstrap account
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Enter the configured email. We will send one setup link to that inbox
          so the owner can create the admin password.
        </p>
      </div>

      <form action={formAction} className="mt-4 grid gap-3">
        {state.message ? (
          <div
            className={
              state.status === "success"
                ? "rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                : "rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            }
          >
            {state.message}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Display name
          </span>
          <input
            type="text"
            name="name"
            required
            defaultValue={state.values.name}
            placeholder="Your name"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
          {state.errors.name ? (
            <span className="text-[11px] text-red-600">{state.errors.name}</span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={state.values.email}
            placeholder="name@example.com"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
          {state.errors.email ? (
            <span className="text-[11px] text-red-600">{state.errors.email}</span>
          ) : null}
        </label>

        <SubmitButton />
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
