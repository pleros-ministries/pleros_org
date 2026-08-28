"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSogpBirthYearOptions,
  normalizeSogpEnrollment,
  SOGP_REFERRAL_OPTIONS,
  validateSogpEnrollment,
  type SogpEnrollmentErrors,
} from "@/lib/sogp/enrollment";
import { getSogpCountryOrDefault } from "@/lib/sogp/countries";
import { CountryCombobox } from "./country-combobox";
import { PhoneField } from "./phone-field";
import { trackSogpEvent } from "./sogp-analytics";

type EnrollmentResponse = {
  redirectTo?: string;
  errors?: SogpEnrollmentErrors;
  error?: string;
};

// Fields validated inline, in the order they appear so we can focus the first
// one that still needs attention on a blocked submit.
const FIELD_ORDER = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "country",
  "countryCode",
  "region",
  "birthYear",
  "referralSource",
] as const;

type FieldName = (typeof FIELD_ORDER)[number];

const FOCUS_TARGET: Partial<Record<FieldName, string>> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phone: "phone",
  country: "country",
  countryCode: "country",
  region: "region",
  birthYear: "birthYear",
  referralSource: "referralSource",
};

const BIRTH_YEAR_OPTIONS = getSogpBirthYearOptions();

const FILL_IN_MESSAGE =
  "Please fill in the highlighted fields before completing your enrolment.";

async function submitEnrollment(body: Record<string, unknown>) {
  const params = new URLSearchParams(window.location.search);
  const response = await fetch("/api/sogp/enrol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
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
  defaultCountryCode: CountryCode;
}) {
  const initialCountry = getSogpCountryOrDefault(defaultCountryCode);

  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    region: "",
    birthYear: "",
    referralSource: "",
    whatsappConsent: false,
    phone: "",
    phoneCountryCode: defaultCountryCode as CountryCode,
    country: initialCountry.label,
    countryCode: initialCountry.code as string,
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<SogpEnrollmentErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Validate through the same normalize/validate the server uses, so what the
  // visitor sees inline matches exactly what the API would reject.
  const clientErrors = useMemo(
    () => validateSogpEnrollment(normalizeSogpEnrollment(values)),
    [values],
  );

  const mutation = useMutation({
    mutationFn: submitEnrollment,
    onSuccess(payload) {
      trackSogpEvent("sogp_enrolment_completed");
      window.location.assign(payload.redirectTo ?? "/dashboard/sogp");
    },
    onError(error: EnrollmentResponse) {
      const fieldErrors = error.errors ?? {};
      setServerErrors(fieldErrors);
      setSubmitAttempted(true);
      setFormError(
        error.error ??
          (Object.keys(fieldErrors).length > 0
            ? FILL_IN_MESSAGE
            : "We could not complete your enrolment. Try again."),
      );
    },
  });

  function clearServerError(field: keyof SogpEnrollmentErrors) {
    // A fresh edit supersedes whatever the server last said about that field.
    setServerErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    clearServerError(key as keyof SogpEnrollmentErrors);
  }

  function markTouched(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  // Show a field's error once it has been touched or a submit was attempted;
  // a server-reported error always shows.
  function errorFor(field: keyof SogpEnrollmentErrors): string | undefined {
    if (serverErrors[field]) return serverErrors[field];
    if (submitAttempted || touched[field as FieldName]) return clientErrors[field];
    return undefined;
  }

  const firstNameError = errorFor("firstName");
  const lastNameError = errorFor("lastName");
  const emailError = errorFor("email");
  const phoneError = errorFor("phone");
  const countryError = errorFor("country") ?? errorFor("countryCode");
  const regionError = errorFor("region");
  const birthYearError = errorFor("birthYear");
  const referralSourceError = errorFor("referralSource");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setServerErrors({});
    trackSogpEvent("sogp_enrolment_started");

    if (Object.keys(clientErrors).length > 0) {
      setFormError(FILL_IN_MESSAGE);
      const firstInvalid = FIELD_ORDER.find((field) => clientErrors[field]);
      const focusId = firstInvalid ? FOCUS_TARGET[firstInvalid] : undefined;
      if (focusId) document.getElementById(focusId)?.focus();
      return;
    }

    setFormError(null);
    mutation.mutate(values);
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="firstName" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">First name</label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={values.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            onBlur={() => markTouched("firstName")}
            aria-invalid={Boolean(firstNameError)}
            aria-describedby={firstNameError ? "first-name-error" : undefined}
          />
          <FieldError id="first-name-error" error={firstNameError} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="lastName" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Surname</label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            onBlur={() => markTouched("lastName")}
            aria-invalid={Boolean(lastNameError)}
            aria-describedby={lastNameError ? "last-name-error" : undefined}
          />
          <FieldError id="last-name-error" error={lastNameError} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="email" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Email address</label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => markTouched("email")}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        <FieldError id="email-error" error={emailError} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="phone" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Phone number</label>
        <PhoneField
          defaultCountryCode={defaultCountryCode}
          invalid={Boolean(phoneError)}
          describedBy={phoneError ? "phone-help phone-error" : "phone-help"}
          onChange={(next) => {
            setValues((current) => ({
              ...current,
              phone: next.phone,
              phoneCountryCode: next.countryCode,
            }));
            clearServerError("phone");
          }}
          onBlur={() => markTouched("phone")}
        />
        <p id="phone-help" className="font-[var(--font-be-vietnam-pro)] text-xs leading-[1.45] text-[var(--color-text-muted)]">Use the number linked to your WhatsApp account.</p>
        <FieldError id="phone-error" error={phoneError} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="country" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Country of residence</label>
        <CountryCombobox
          defaultCountryCode={defaultCountryCode}
          invalid={Boolean(countryError)}
          describedBy={countryError ? "country-error" : undefined}
          onCountryChange={(country) => {
            setValues((current) => ({
              ...current,
              country: country.label,
              countryCode: country.code,
            }));
            clearServerError("country");
            clearServerError("countryCode");
            markTouched("country");
          }}
        />
        <FieldError id="country-error" error={countryError} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="region" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">State / province / region</label>
          <Input
            id="region"
            name="region"
            autoComplete="address-level1"
            value={values.region}
            onChange={(event) => update("region", event.target.value)}
            onBlur={() => markTouched("region")}
            aria-invalid={Boolean(regionError)}
            aria-describedby={regionError ? "region-error" : undefined}
          />
          <FieldError id="region-error" error={regionError} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="birthYear" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">Year of birth</label>
          <select
            id="birthYear"
            name="birthYear"
            autoComplete="bday-year"
            value={values.birthYear}
            onChange={(event) => update("birthYear", event.target.value)}
            onBlur={() => markTouched("birthYear")}
            aria-invalid={Boolean(birthYearError)}
            aria-describedby={birthYearError ? "birth-year-error" : undefined}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 text-sm text-[var(--color-text-strong)] outline-none transition focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)]"
          >
            <option value="">Select year</option>
            {BIRTH_YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <FieldError id="birth-year-error" error={birthYearError} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="referralSource" className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">How did you hear about us?</label>
        <select
          id="referralSource"
          name="referralSource"
          value={values.referralSource}
          onChange={(event) => update("referralSource", event.target.value)}
          onBlur={() => markTouched("referralSource")}
          aria-invalid={Boolean(referralSourceError)}
          aria-describedby={referralSourceError ? "referral-source-error" : undefined}
          className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 text-sm text-[var(--color-text-strong)] outline-none transition focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)]"
        >
          <option value="">Select an option</option>
          {SOGP_REFERRAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <FieldError id="referral-source-error" error={referralSourceError} />
      </div>
      <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
        <input
          type="checkbox"
          name="whatsappConsent"
          checked={values.whatsappConsent}
          onChange={(event) => update("whatsappConsent", event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand-blue)]"
        />
        <span className="font-[var(--font-be-vietnam-pro)] text-xs leading-[1.5] text-[var(--color-text-muted)]">
          I agree to receive SOGP updates and course reminders via WhatsApp. I can opt out at any time.
        </span>
      </label>
      {formError ? (
        <div role="alert" className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-2.5 font-[var(--font-be-vietnam-pro)] text-xs leading-[1.5] text-red-800">{formError}</div>
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
