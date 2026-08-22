"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitContactFormAction,
} from "@/app/_actions/contact-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INITIAL_CONTACT_SUBMIT_STATE } from "@/lib/contact-form-state";
import {
  contactFormFields,
  contactMessagePlaceholder,
  contactSubmitLabel,
} from "@/lib/contact-page-content";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="mt-1 min-h-[2.875rem] w-full rounded-full px-6 text-[0.875rem] font-semibold tracking-[0.02em]"
    >
      {pending ? "Sending..." : contactSubmitLabel}
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(
    submitContactFormAction,
    INITIAL_CONTACT_SUBMIT_STATE,
  );
  const [formStartedAt] = useState(() => Date.now());

  return (
    <form className="grid gap-3.5" action={formAction}>
      <input
        type="hidden"
        name="formStartedAt"
        value={String(formStartedAt)}
      />
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {contactFormFields.map((field) => {
        const error = state.errors[field.name as keyof typeof state.errors];
        const value = state.values[field.name as keyof typeof state.values];

        return (
          <div key={field.id} className="grid gap-1.5">
            <Input
              id={field.id}
              name={field.name}
              type={field.type}
              defaultValue={value}
              placeholder={field.placeholder}
              aria-label={field.placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${field.id}-error` : undefined}
              className="h-[2.6875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.12)] px-4 text-[0.875rem] text-[var(--color-text-strong)] placeholder:text-[rgba(6,16,86,0.55)]"
            />
            {error ? (
              <p
                id={`${field.id}-error`}
                className="text-left text-[0.78rem] text-[var(--destructive)]"
              >
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="grid gap-1.5">
        <textarea
          id="message"
          name="message"
          defaultValue={state.values.message}
          placeholder={contactMessagePlaceholder}
          aria-label={contactMessagePlaceholder}
          aria-invalid={Boolean(state.errors.message)}
          aria-describedby={state.errors.message ? "message-error" : undefined}
          className="min-h-[6.875rem] w-full rounded-[0.75rem] border border-[rgba(6,16,86,0.12)] bg-white px-4 py-3 text-[0.875rem] text-[var(--color-text-strong)] outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-[rgba(6,16,86,0.55)] focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] md:min-h-[8rem]"
        />
        {state.errors.message ? (
          <p
            id="message-error"
            className="text-left text-[0.78rem] text-[var(--destructive)]"
          >
            {state.errors.message}
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
