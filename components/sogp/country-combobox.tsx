"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import {
  getSogpCountryOrDefault,
  SOGP_COUNTRIES,
  type SogpCountryOption,
} from "@/lib/sogp/countries";
import { CountryFlag } from "./country-flag";

type CountryComboboxProps = {
  defaultCountryCode: CountryCode;
  describedBy?: string;
  invalid?: boolean;
  onCountryChange?: (country: SogpCountryOption) => void;
};

/**
 * A native <select> rather than a search popup: the list is long, but a picker
 * the browser owns is the only one guaranteed to open on every device we see,
 * including older phones where a JS-rendered dropdown never appears.
 */
export function CountryCombobox({
  defaultCountryCode,
  describedBy,
  invalid,
  onCountryChange,
}: CountryComboboxProps) {
  const [selected, setSelected] = useState<SogpCountryOption>(() =>
    getSogpCountryOrDefault(defaultCountryCode),
  );

  return (
    <div className="sogp-field-control" data-invalid={invalid || undefined}>
      <span className="sogp-field-lead">
        <CountryFlag code={selected.code} />
      </span>
      <select
        id="country"
        value={selected.code}
        onChange={(event) => {
          const country = SOGP_COUNTRIES.find(
            (option) => option.code === event.target.value,
          );
          if (!country) return;
          setSelected(country);
          onCountryChange?.(country);
        }}
        required
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="sogp-field-input sogp-field-select [font-size:0.875rem]"
      >
        {SOGP_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.label}
          </option>
        ))}
      </select>
      <span className="sogp-field-trigger" aria-hidden="true">
        <ChevronDown className="size-4" />
      </span>

      <input type="hidden" name="country" value={selected.label} />
      <input type="hidden" name="countryCode" value={selected.code} />
    </div>
  );
}
