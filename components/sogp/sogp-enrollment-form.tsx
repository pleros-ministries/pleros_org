"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Select } from "@base-ui/react/select";
import { ArrowRight, Check, ChevronDown, LoaderCircle } from "lucide-react";
import Link from "next/link";
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
  "referralSourceOther",
  "whatsappConsent",
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
  referralSourceOther: "referralSourceOther",
  whatsappConsent: "whatsappConsentYes",
};

const BIRTH_YEAR_OPTIONS = getSogpBirthYearOptions();

const FILL_IN_MESSAGE =
  "Please fill in the highlighted fields before completing your enrolment.";

async function submitEnrollment(body: Record<string, unknown>) {
  const params = new URLSearchParams(window.location.search);
  const response = await fetch("/api/sogp/enrol/start", {
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
    <p id={id} className="font-[var(--font-be-vietnam-pro)] [font-size:0.75rem] text-[var(--destructive)]">
      {error}
    </p>
  ) : null;
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-[var(--destructive)]">
      *
    </span>
  );
}

function ReferralSourceFields({
  source,
  otherSource,
  sourceError,
  otherSourceError,
  onSourceChange,
  onOtherSourceChange,
}: {
  source: string;
  otherSource: string;
  sourceError?: string;
  otherSourceError?: string;
  onSourceChange: (value: string) => void;
  onOtherSourceChange: (value: string) => void;
}) {
  const selectedOption =
    SOGP_REFERRAL_OPTIONS.find((option) => option.value === source) ?? null;

  return (
    <div className="grid gap-2">
      <label htmlFor="referralSource" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">How did you hear about us?<RequiredMark /></label>
      <Select.Root
        items={SOGP_REFERRAL_OPTIONS}
        value={selectedOption}
        onValueChange={(value) => {
          if (value) onSourceChange(value.value);
        }}
        itemToStringLabel={(option) => option.label}
        itemToStringValue={(option) => option.value}
        isItemEqualToValue={(left, right) => left.value === right.value}
        name="referralSource"
        required
      >
        <Select.Trigger
          id="referralSource"
          aria-invalid={Boolean(sourceError)}
          aria-describedby={sourceError ? "referral-source-error" : undefined}
          className={`relative flex h-11 w-full items-center rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 pr-11 text-left [font-size:0.875rem] outline-none transition aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100 focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] ${source ? "text-[var(--color-text-strong)]" : "text-[var(--color-text-muted)]"}`}
        >
          <Select.Value placeholder="Select an option" />
          <Select.Icon
            render={
              <ChevronDown
                className={`pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 ${source ? "text-[var(--color-brand-blue)]" : "text-[var(--color-text-muted)]"}`}
                aria-hidden="true"
              />
            }
          />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={6} className="sogp-popup-positioner">
            <Select.Popup className="sogp-popup sogp-referral-popup">
              <Select.List className="sogp-popup-list">
          {SOGP_REFERRAL_OPTIONS.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option}
                    label={option.label}
                    className="sogp-popup-item sogp-referral-popup-item"
                  >
                    <Select.ItemText className="sogp-popup-item-label">
                      {option.label}
                    </Select.ItemText>
                    <Select.ItemIndicator className="sogp-popup-item-check">
                      <Check className="size-3.5" aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
          ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <FieldError id="referral-source-error" error={sourceError} />
      {source === "other" ? (
        <div className="grid gap-2 pt-1">
          <label htmlFor="referralSourceOther" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">
            Tell us how you heard about us<RequiredMark />
          </label>
          <Input
            id="referralSourceOther"
            name="referralSourceOther"
            autoComplete="off"
            maxLength={120}
            value={otherSource}
            onChange={(event) => onOtherSourceChange(event.target.value)}
            required
            aria-invalid={Boolean(otherSourceError)}
            aria-describedby={otherSourceError ? "referral-source-other-error" : undefined}
            placeholder="Enter the source"
            className="aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100"
          />
          <FieldError id="referral-source-other-error" error={otherSourceError} />
        </div>
      ) : null}
    </div>
  );
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
    referralSourceOther: "",
    whatsappConsent: "" as "" | "yes" | "no",
    phone: "",
    phoneCountryCode: defaultCountryCode as CountryCode,
    country: initialCountry.label,
    countryCode: initialCountry.code as string,
  });
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
      trackSogpEvent("sogp_email_verification_sent");
      window.location.assign(payload.redirectTo ?? "/setup");
    },
    onError(error: EnrollmentResponse) {
      const fieldErrors = error.errors ?? {};
      setServerErrors(fieldErrors);
      setSubmitAttempted(true);
      setFormError(
        error.error ??
          (Object.keys(fieldErrors).length > 0
            ? FILL_IN_MESSAGE
            : "We could not start account setup. Try again."),
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

  // Keep incomplete fields neutral until submit. Server-reported errors always
  // show, and a submit attempt reveals all current client-side errors.
  function errorFor(field: keyof SogpEnrollmentErrors): string | undefined {
    if (serverErrors[field]) return serverErrors[field];
    if (submitAttempted) return clientErrors[field];
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
  const referralSourceOtherError = errorFor("referralSourceOther");
  const whatsappConsentError = errorFor("whatsappConsent");

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
          <label htmlFor="firstName" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">First name<RequiredMark /></label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={values.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            required
            aria-invalid={Boolean(firstNameError)}
            aria-describedby={firstNameError ? "first-name-error" : undefined}
            className="aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100"
          />
          <FieldError id="first-name-error" error={firstNameError} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="lastName" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Surname/Last name<RequiredMark /></label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            required
            aria-invalid={Boolean(lastNameError)}
            aria-describedby={lastNameError ? "last-name-error" : undefined}
            className="aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100"
          />
          <FieldError id="last-name-error" error={lastNameError} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="email" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Email address<RequiredMark /></label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          required
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
          className="aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100"
        />
        <FieldError id="email-error" error={emailError} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="phone" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Phone number<RequiredMark /></label>
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
        />
        <p id="phone-help" className="font-[var(--font-be-vietnam-pro)] [font-size:0.75rem] leading-[1.45] text-[var(--color-text-muted)]">Use the number linked to your WhatsApp account.</p>
        <FieldError id="phone-error" error={phoneError} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="country" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Country of residence<RequiredMark /></label>
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
          }}
        />
        <FieldError id="country-error" error={countryError} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="region" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">State/Province/Region of residence<RequiredMark /></label>
          <Input
            id="region"
            name="region"
            autoComplete="address-level1"
            value={values.region}
            onChange={(event) => update("region", event.target.value)}
            required
            aria-invalid={Boolean(regionError)}
            aria-describedby={regionError ? "region-error" : undefined}
            className="aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100"
          />
          <FieldError id="region-error" error={regionError} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="birthYear" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Year of birth<RequiredMark /></label>
          <div className="relative">
            <select
              id="birthYear"
              name="birthYear"
              autoComplete="bday-year"
              value={values.birthYear}
              onChange={(event) => update("birthYear", event.target.value)}
              required
              aria-invalid={Boolean(birthYearError)}
              aria-describedby={birthYearError ? "birth-year-error" : undefined}
              className={`h-11 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 pr-11 [font-size:0.875rem] outline-none transition aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-red-100 focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] ${values.birthYear ? "text-[var(--color-text-strong)]" : "text-[var(--color-text-muted)]"}`}
            >
              <option value="">Select year</option>
              {BIRTH_YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 ${values.birthYear ? "text-[var(--color-brand-blue)]" : "text-[var(--color-text-muted)]"}`} aria-hidden="true" />
          </div>
          <FieldError id="birth-year-error" error={birthYearError} />
        </div>
      </div>
      <ReferralSourceFields
        source={values.referralSource}
        otherSource={values.referralSourceOther}
        sourceError={referralSourceError}
        otherSourceError={referralSourceOtherError}
        onSourceChange={(referralSource) => {
          setValues((current) => ({
            ...current,
            referralSource,
            referralSourceOther:
              referralSource === "other" ? current.referralSourceOther : "",
          }));
          clearServerError("referralSource");
          clearServerError("referralSourceOther");
        }}
        onOtherSourceChange={(value) => update("referralSourceOther", value)}
      />
      <fieldset
        className="grid gap-3"
        aria-invalid={Boolean(whatsappConsentError)}
        aria-describedby={whatsappConsentError ? "whatsapp-consent-error" : undefined}
      >
        <legend className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium leading-[1.45] text-[var(--color-text-strong)]">
          Would you like to receive SOGP updates via WhatsApp?<RequiredMark />
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((option) => (
            <label
              key={option}
              htmlFor={`whatsappConsent${option === "yes" ? "Yes" : "No"}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 [font-size:0.875rem] font-medium text-[var(--color-text-strong)] transition-colors duration-150 has-[:checked]:border-[var(--color-brand-blue)] has-[:checked]:bg-[var(--color-brand-sky-soft)] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--color-focus)]"
            >
              <input
                id={`whatsappConsent${option === "yes" ? "Yes" : "No"}`}
                type="radio"
                name="whatsappConsent"
                value={option}
                checked={values.whatsappConsent === option}
                onChange={() => update("whatsappConsent", option)}
                required
                aria-invalid={Boolean(whatsappConsentError)}
                aria-describedby={whatsappConsentError ? "whatsapp-consent-error" : undefined}
                className="size-4 shrink-0 accent-[var(--color-brand-blue)]"
              />
              <span>{option === "yes" ? "Yes" : "No"}</span>
            </label>
          ))}
        </div>
        <FieldError id="whatsapp-consent-error" error={whatsappConsentError} />
      </fieldset>
      {formError ? (
        <div role="alert" className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-2.5 font-[var(--font-be-vietnam-pro)] [font-size:0.75rem] leading-[1.5] text-red-800">{formError}</div>
      ) : null}
      <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-3 min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] [font-size:0.875rem] text-white">
        {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
         {mutation.isPending ? "Sending verification code" : "Continue setup"}
        {!mutation.isPending ? <ArrowRight className="size-4" /> : null}
      </Button>
      <Link
        href="/login?returnTo=/dashboard/sogp"
        className="text-center [font-size:0.8125rem] font-medium text-[var(--color-brand-blue)]"
      >
        Already enrolled? Log in
      </Link>
      <p className="font-[var(--font-be-vietnam-pro)] [font-size:0.75rem] leading-[1.5] text-[var(--color-text-muted)]">
        Your information is kept private and used only to support your SOGP experience. We will not sell your personal information.
      </p>
    </form>
  );
}
