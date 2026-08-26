"use client";

import { useMemo, useState } from "react";
import type { Country } from "react-phone-number-input";

import {
  getSogpCountry,
  SOGP_COUNTRIES,
} from "@/lib/sogp/countries";

type CountryComboboxProps = {
  defaultCountryCode: Country;
  describedBy?: string;
  invalid?: boolean;
};

export function CountryCombobox({
  defaultCountryCode,
  describedBy,
  invalid,
}: CountryComboboxProps) {
  const initial = useMemo(
    () => getSogpCountry(defaultCountryCode) ?? getSogpCountry("NG")!,
    [defaultCountryCode],
  );
  const [label, setLabel] = useState(initial.label);
  const selected =
    SOGP_COUNTRIES.find(
      (country) => country.label.toLocaleLowerCase() === label.trim().toLocaleLowerCase(),
    ) ?? null;

  return (
    <>
      <input
        id="country"
        name="country"
        list="sogp-country-options"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        autoComplete="country-name"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-white px-4 text-sm text-[var(--color-text-strong)] outline-none transition focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)]"
      />
      <input type="hidden" name="countryCode" value={selected?.code ?? ""} />
      <datalist id="sogp-country-options">
        {SOGP_COUNTRIES.map((country) => (
          <option key={country.code} value={country.label}>
            {country.code}
          </option>
        ))}
      </datalist>
    </>
  );
}
