"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  completeSuperAdminSetupAction,
  type SuperAdminPasswordSetupState,
} from "@/app/admin/setup/actions";

const initialState: SuperAdminPasswordSetupState = {
  status: "idle",
  message: "",
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
      {pending ? "Saving..." : "Save password"}
    </button>
  );
}

type SuperAdminPasswordSetupFormProps = {
  token: string;
  email: string;
  name: string;
};

export function SuperAdminPasswordSetupForm({
  token,
  email,
  name,
}: SuperAdminPasswordSetupFormProps) {
  const [state, formAction] = useActionState(
    completeSuperAdminSetupAction,
    initialState,
  );

  return (
    <>
      <div className="mt-4 rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Verified setup link
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {name} · {email}
        </p>
      </div>

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="token" value={token} />

        {state.message ? (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.message}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
          {state.errors.password ? (
            <span className="text-[11px] text-red-600">
              {state.errors.password}
            </span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Confirm password
          </span>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
          {state.errors.confirmPassword ? (
            <span className="text-[11px] text-red-600">
              {state.errors.confirmPassword}
            </span>
          ) : null}
        </label>

        <SubmitButton />
      </form>
    </>
  );
}
