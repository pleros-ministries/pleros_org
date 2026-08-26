"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import PhoneInput, { type Country, type Value } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SogpEnrollmentErrors } from "@/lib/sogp/enrollment";
import { CountryCombobox } from "./country-combobox";
import { trackSogpEvent } from "./sogp-analytics";

type EnrollmentResponse = {
  redirectTo?: string;
  errors?: SogpEnrollmentErrors;
  error?: string;
};

async function submitEnrollment(formData: FormData) {
  const params = new URLSearchParams(window.location.search);
  const response = await fetch("/api/sogp/enrol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.get("name"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      country: formData.get("country"),
      countryCode: formData.get("countryCode"),
      region: formData.get("region"),
      reason: formData.get("reason"),
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      utmContent: params.get("utm_content"),
      utmTerm: params.get("utm_term"),
    }),
  });
  const payload = (await response.json()) as EnrollmentResponse;
  if (!response.ok) throw payload;
  return payload;
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="font-[var(--font-be-vietnam-pro)] text-xs text-[var(--destructive)]">
      {error}
    </p>
  ) : null;
}

export function SogpEnrollmentForm({
  defaultCountryCode,
}: {
  defaultCountryCode: Country;
}) {
  const [errors, setErrors] = useState<SogpEnrollmentErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phone, setPhone] = useState<Value>();
  const mutation = useMutation({
    mutationFn: submitEnrollment,
    onSuccess(payload) {
      trackSogpEvent("sogp_enrolment_completed");
      window.location.assign(payload.redirectTo ?? "/dashboard/sogp");
    },
    onError(error: EnrollmentResponse) {
      setErrors(error.errors ?? {});
      setFormError(error.error ?? "We could not complete your enrolment. Try again.");
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setErrors({});
        setFormError(null);
        trackSogpEvent("sogp_enrolment_started");
        mutation.mutate(new FormData(event.currentTarget));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="firstName" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">First name</label>
          <Input id="firstName" name="firstName" autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? "first-name-error" : undefined} />
          <FieldError id="first-name-error" error={errors.firstName} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="lastName" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Last name</label>
          <Input id="lastName" name="lastName" autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} aria-describedby={errors.lastName ? "last-name-error" : undefined} />
          <FieldError id="last-name-error" error={errors.lastName} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="email" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Email address</label>
        <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
        <FieldError id="email-error" error={errors.email} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="phone" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Phone number</label>
        <PhoneInput
          id="phone"
          className="sogp-phone-input"
          defaultCountry={defaultCountryCode}
          value={phone}
          onChange={setPhone}
          international
          countryCallingCodeEditable={false}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-help phone-error" : "phone-help"}
        />
        <input type="hidden" name="phone" value={phone ?? ""} />
        <p id="phone-help" className="font-[var(--font-be-vietnam-pro)] text-xs leading-[1.45] text-[var(--color-text-muted)]">Use the number linked to your WhatsApp account.</p>
        <FieldError id="phone-error" error={errors.phone} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="country" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Country of residence</label>
        <CountryCombobox defaultCountryCode={defaultCountryCode} invalid={Boolean(errors.country || errors.countryCode)} describedBy={errors.country || errors.countryCode ? "country-error" : undefined} />
        <FieldError id="country-error" error={errors.country ?? errors.countryCode} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="region" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">State / province / region</label>
        <Input id="region" name="region" autoComplete="address-level1" aria-invalid={Boolean(errors.region)} aria-describedby={errors.region ? "region-error" : undefined} />
        <FieldError id="region-error" error={errors.region} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="reason" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Why do you want to join? <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
        <textarea id="reason" name="reason" rows={4} maxLength={1000} className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 py-3 font-[var(--font-be-vietnam-pro)] text-sm text-[var(--color-text-strong)] outline-none transition focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)]" aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? "reason-error" : undefined} />
        <FieldError id="reason-error" error={errors.reason} />
      </div>
      {formError ? (
        <div role="alert" className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 font-[var(--font-be-vietnam-pro)] text-sm text-red-800">{formError}</div>
      ) : null}
      <Button type="submit" size="lg" disabled={mutation.isPending} className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] text-white">
        {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {mutation.isPending ? "Completing enrolment" : "Complete enrolment"}
        {!mutation.isPending ? <ArrowRight className="size-4" /> : null}
      </Button>
      <p className="text-center font-[var(--font-be-vietnam-pro)] text-xs leading-[1.5] text-[var(--color-text-muted)]">
        Your information is kept private and used only to manage your enrolment, learning experience, and relevant SOGP communications. We will not sell your personal information.
      </p>
    </form>
  );
}
