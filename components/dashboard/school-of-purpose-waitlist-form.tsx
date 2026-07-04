"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2Icon } from "lucide-react";

import {
  INITIAL_SCHOOL_OF_PURPOSE_WAITLIST_STATE,
  joinSchoolOfPurposeWaitlistAction,
} from "@/app/_actions/school-of-purpose-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="mt-1 min-h-[2.875rem] w-full rounded-full px-6 text-[0.875rem] font-semibold tracking-[0.02em]"
    >
      {pending ? "Joining..." : "Join the waitlist"}
    </Button>
  );
}

type SchoolOfPurposeWaitlistFormProps = {
  initialName: string;
  initialPhone: string;
  alreadyJoined: boolean;
};

export function SchoolOfPurposeWaitlistForm({
  initialName,
  initialPhone,
  alreadyJoined,
}: SchoolOfPurposeWaitlistFormProps) {
  const [state, formAction] = useActionState(joinSchoolOfPurposeWaitlistAction, {
    ...INITIAL_SCHOOL_OF_PURPOSE_WAITLIST_STATE,
    values: { name: initialName, phone: initialPhone },
    success: alreadyJoined,
  });

  if (state.success) {
    return (
      <div className="flex items-start gap-3 rounded-[1.25rem] bg-[var(--color-brand-sky)] px-4 py-4">
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-[var(--color-brand-blue)]" />
        <div className="grid gap-1">
          <p className="font-[var(--font-be-vietnam-pro)] text-[0.9rem] font-semibold text-[var(--color-brand-blue)]">
            You&apos;re on the waitlist
          </p>
          <p className="font-[var(--font-be-vietnam-pro)] text-[0.86rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-brand-blue)]">
            We&apos;ll reach out on WhatsApp with details as soon as the next
            cohort opens up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-3.5" action={formAction}>
      <div className="grid gap-1.5">
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={state.values.name}
          placeholder="Full name"
          aria-label="Full name"
          aria-invalid={Boolean(state.errors.name)}
          aria-describedby={state.errors.name ? "name-error" : undefined}
          className="h-[2.6875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.12)] px-4 text-[0.875rem] text-[var(--color-text-strong)] placeholder:text-[rgba(6,16,86,0.55)]"
        />
        {state.errors.name ? (
          <p id="name-error" className="text-left text-[0.78rem] text-[var(--destructive)]">
            {state.errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={state.values.phone}
          placeholder="WhatsApp number"
          aria-label="WhatsApp number"
          aria-invalid={Boolean(state.errors.phone)}
          aria-describedby={state.errors.phone ? "phone-error" : undefined}
          className="h-[2.6875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.12)] px-4 text-[0.875rem] text-[var(--color-text-strong)] placeholder:text-[rgba(6,16,86,0.55)]"
        />
        {state.errors.phone ? (
          <p id="phone-error" className="text-left text-[0.78rem] text-[var(--destructive)]">
            {state.errors.phone}
          </p>
        ) : null}
      </div>

      {state.formError ? (
        <p className="text-left text-[0.82rem] text-[var(--destructive)]">
          {state.formError}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
