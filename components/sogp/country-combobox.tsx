"use client";

import { useRef, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import {
  getSogpCountryOrDefault,
  matchesSogpCountryQuery,
  SOGP_COUNTRIES,
  type SogpCountryOption,
} from "@/lib/sogp/countries";
import { CountryFlag } from "./country-flag";
import { CountryOptions } from "./country-options";

type CountryComboboxProps = {
  defaultCountryCode: CountryCode;
  describedBy?: string;
  invalid?: boolean;
  onCountryChange?: (country: SogpCountryOption) => void;
};

export function CountryCombobox({
  defaultCountryCode,
  describedBy,
  invalid,
  onCountryChange,
}: CountryComboboxProps) {
  const [selected, setSelected] = useState<SogpCountryOption>(() =>
    getSogpCountryOrDefault(defaultCountryCode),
  );
  const [query, setQuery] = useState(() => selected.label);
  // Read synchronously while the popup closes, before the state update lands.
  const selectedRef = useRef(selected);

  return (
    <Combobox.Root
      items={SOGP_COUNTRIES}
      value={selected}
      onValueChange={(country: SogpCountryOption | null) => {
        if (!country) return;
        selectedRef.current = country;
        setSelected(country);
        setQuery(country.label);
        onCountryChange?.(country);
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(open: boolean) => {
        // An unmatched search should not linger in the field once it closes.
        if (!open) setQuery(selectedRef.current.label);
      }}
      itemToStringLabel={(country: SogpCountryOption) => country.label}
      itemToStringValue={(country: SogpCountryOption) => country.code}
      isItemEqualToValue={(left: SogpCountryOption, right: SogpCountryOption) =>
        left.code === right.code
      }
      filter={(country: SogpCountryOption, search: string) =>
        matchesSogpCountryQuery(country, search)
      }
      autoHighlight
    >
      <div className="sogp-field-control" data-invalid={invalid || undefined}>
        <span className="sogp-field-lead">
          <CountryFlag code={selected.code} />
        </span>
        <Combobox.Input
          id="country"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search for your country"
          required
          aria-required="true"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="sogp-field-input [font-size:0.875rem]"
        />
        <Combobox.Trigger
          className="sogp-field-trigger"
          aria-label="Show country list"
        >
          <Combobox.Icon
            render={<ChevronDown className="size-4" aria-hidden="true" />}
          />
        </Combobox.Trigger>
      </div>

      <input type="hidden" name="country" value={selected.label} />
      <input type="hidden" name="countryCode" value={selected.code} />

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="sogp-popup-positioner">
          <Combobox.Popup className="sogp-popup">
            <CountryOptions />
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
