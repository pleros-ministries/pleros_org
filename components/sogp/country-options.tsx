"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, Globe } from "lucide-react";

import type { SogpCountryOption } from "@/lib/sogp/countries";
import { CountryFlag } from "./country-flag";

/**
 * The scrollable country list shared by the country field and the phone field's
 * dialling-code picker, so both read as the same control.
 */
export function CountryOptions({
  showCallingCode = true,
}: {
  showCallingCode?: boolean;
}) {
  return (
    <>
      <Combobox.Empty className="sogp-popup-empty">
        <Globe className="size-4" aria-hidden="true" />
        No country matches that search.
      </Combobox.Empty>
      <Combobox.List className="sogp-popup-list">
        {(country: SogpCountryOption) => (
          <Combobox.Item
            key={country.code}
            value={country}
            className="sogp-popup-item"
          >
            <CountryFlag code={country.code} />
            <span className="sogp-popup-item-label">{country.label}</span>
            {showCallingCode ? (
              <span className="sogp-popup-item-meta">+{country.callingCode}</span>
            ) : null}
            <Combobox.ItemIndicator className="sogp-popup-item-check">
              <Check className="size-4" aria-hidden="true" />
            </Combobox.ItemIndicator>
          </Combobox.Item>
        )}
      </Combobox.List>
    </>
  );
}
