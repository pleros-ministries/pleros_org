"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitFirstTimeWorshipperAction } from "@/app/_actions/first-time-worshipper-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  INITIAL_FIRST_TIME_WORSHIPPER_SUBMIT_STATE,
  type FirstTimeWorshipperSubmitState,
} from "@/lib/first-time-worshippers";
import { fcchurchVisitorLocations } from "@/lib/fcchurch-page-content";

type FirstTimeWorshipperFormProps = {
  welcomeEmail: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="site-button-text mt-2 min-h-[2.875rem] w-full rounded-full bg-[var(--color-brand-blue)] px-6 text-[0.875rem] font-semibold text-white hover:bg-[var(--color-brand-blue)]/90"
    >
      {pending ? "Sending your details..." : "Send my details"}
    </Button>
  );
}

function FieldError({ error, id }: { error?: string; id: string }) {
  return error ? (
    <p id={`${id}-error`} className="text-[0.78rem] text-[var(--destructive)]">
      {error}
    </p>
  ) : null;
}

export function FirstTimeWorshipperForm({
  welcomeEmail,
}: FirstTimeWorshipperFormProps) {
  const initialState: FirstTimeWorshipperSubmitState = {
    ...INITIAL_FIRST_TIME_WORSHIPPER_SUBMIT_STATE,
    values: {
      ...INITIAL_FIRST_TIME_WORSHIPPER_SUBMIT_STATE.values,
      email: welcomeEmail ?? "",
    },
  };
  const [state, formAction] = useActionState(
    submitFirstTimeWorshipperAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-1.5">
        <label htmlFor="fullName" className="site-button-text text-[0.8rem] font-semibold text-[var(--color-text-strong)]">
          Full name
        </label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={state.values.fullName}
          aria-invalid={Boolean(state.errors.fullName)}
          aria-describedby={state.errors.fullName ? "fullName-error" : undefined}
          className="h-[2.875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.14)] px-4 text-[0.9rem]"
        />
        <FieldError id="fullName" error={state.errors.fullName} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="phone" className="site-button-text text-[0.8rem] font-semibold text-[var(--color-text-strong)]">
          Phone number
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={state.values.phone}
          aria-invalid={Boolean(state.errors.phone)}
          aria-describedby={state.errors.phone ? "phone-error" : undefined}
          className="h-[2.875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.14)] px-4 text-[0.9rem]"
        />
        <FieldError id="phone" error={state.errors.phone} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="email" className="site-button-text text-[0.8rem] font-semibold text-[var(--color-text-strong)]">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values.email}
          aria-invalid={Boolean(state.errors.email)}
          aria-describedby={state.errors.email ? "email-error" : undefined}
          className="h-[2.875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.14)] px-4 text-[0.9rem]"
        />
        <FieldError id="email" error={state.errors.email} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="whatsappNumber" className="site-button-text text-[0.8rem] font-semibold text-[var(--color-text-strong)]">
          WhatsApp number
        </label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          type="tel"
          autoComplete="tel"
          defaultValue={state.values.whatsappNumber}
          aria-invalid={Boolean(state.errors.whatsappNumber)}
          aria-describedby={state.errors.whatsappNumber ? "whatsappNumber-error" : undefined}
          className="h-[2.875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.14)] px-4 text-[0.9rem]"
        />
        <FieldError id="whatsappNumber" error={state.errors.whatsappNumber} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="homeAddress" className="site-button-text text-[0.8rem] font-semibold text-[var(--color-text-strong)]">
          Home address
        </label>
        <textarea
          id="homeAddress"
          name="homeAddress"
          autoComplete="street-address"
          defaultValue={state.values.homeAddress}
          aria-invalid={Boolean(state.errors.homeAddress)}
          aria-describedby={state.errors.homeAddress ? "homeAddress-error" : undefined}
          className="min-h-[5.5rem] w-full rounded-[0.75rem] border border-[rgba(6,16,86,0.14)] bg-white px-4 py-3 text-[0.9rem] text-[var(--color-text-strong)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--color-text-muted)] focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)]"
        />
        <FieldError id="homeAddress" error={state.errors.homeAddress} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="location" className="site-button-text text-[0.8rem] font-semibold text-[var(--color-text-strong)]">
          Church location
        </label>
        <select
          id="location"
          name="location"
          defaultValue={state.values.location}
          aria-invalid={Boolean(state.errors.location)}
          aria-describedby={state.errors.location ? "location-error" : undefined}
          className="h-[2.875rem] w-full rounded-[0.75rem] border border-[rgba(6,16,86,0.14)] bg-white px-4 text-[0.9rem] text-[var(--color-text-strong)] outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)]"
        >
          <option value="">Choose your location</option>
          {fcchurchVisitorLocations.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))}
        </select>
        <FieldError id="location" error={state.errors.location} />
      </div>

      {state.formError ? (
        <p className="text-[0.82rem] text-[var(--destructive)]">{state.formError}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
