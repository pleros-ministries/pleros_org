"use client";

import { useMemo, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown, Search } from "lucide-react";
import {
  AsYouType,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import examples from "libphonenumber-js/examples.mobile.json";

import {
  getSogpCountryOrDefault,
  matchesSogpCountryQuery,
  SOGP_COUNTRIES,
  type SogpCountryOption,
} from "@/lib/sogp/countries";
import { CountryFlag } from "./country-flag";
import { CountryOptions } from "./country-options";

/** Keeps typing forgiving while dropping anything a dialler would never accept. */
function sanitize(value: string) {
  return value.replace(/[^\d\s()+.-]/g, "");
}

function formatNational(value: string, country: CountryCode) {
  return new AsYouType(country).input(value);
}

type PhoneFieldProps = {
  defaultCountryCode: CountryCode;
  invalid?: boolean;
  describedBy?: string;
  /** Emits the E.164 number when the input parses, otherwise the raw digits. */
  onChange: (value: { phone: string; countryCode: CountryCode }) => void;
  /** Fires when the tel input loses focus, for touched-based validation. */
  onBlur?: () => void;
};

export function PhoneField({
  defaultCountryCode,
  invalid,
  describedBy,
  onChange,
  onBlur,
}: PhoneFieldProps) {
  const [country, setCountry] = useState<SogpCountryOption>(() =>
    getSogpCountryOrDefault(defaultCountryCode),
  );
  const [value, setValue] = useState("");

  const placeholder = useMemo(() => {
    try {
      return getExampleNumber(country.code, examples)?.formatNational() ?? "";
    } catch {
      return "";
    }
  }, [country.code]);

  function publish(nextValue: string, nextCountry: CountryCode) {
    const parsed = parsePhoneNumberFromString(nextValue, nextCountry);
    onChange({
      phone: parsed?.isValid() ? parsed.number : nextValue,
      countryCode: nextCountry,
    });
  }

  function handleCountryChange(nextCountry: SogpCountryOption) {
    setCountry(nextCountry);
    const reformatted = value ? formatNational(value, nextCountry.code) : value;
    setValue(reformatted);
    publish(reformatted, nextCountry.code);
  }

  function handleInput(rawInput: string) {
    const raw = sanitize(rawInput);

    // Pasting or typing an international number should adopt its country.
    if (raw.trimStart().startsWith("+")) {
      const parsed = parsePhoneNumberFromString(raw);
      if (parsed?.country) {
        const nextCountry = getSogpCountryOrDefault(parsed.country);
        const national = formatNational(parsed.nationalNumber, parsed.country);
        setCountry(nextCountry);
        setValue(national);
        publish(national, parsed.country);
        return;
      }
      setValue(raw);
      publish(raw, country.code);
      return;
    }

    // Re-running the formatter over a shrinking value fights the backspace key,
    // so only format while the number is growing.
    const next = raw.length < value.length ? raw : formatNational(raw, country.code);
    setValue(next);
    publish(next, country.code);
  }

  return (
    <div className="sogp-field-control" data-invalid={invalid || undefined}>
      <Combobox.Root
        items={SOGP_COUNTRIES}
        value={country}
        onValueChange={(next: SogpCountryOption | null) => {
          if (next) handleCountryChange(next);
        }}
        itemToStringLabel={(option: SogpCountryOption) => option.label}
        itemToStringValue={(option: SogpCountryOption) => option.code}
        isItemEqualToValue={(
          left: SogpCountryOption,
          right: SogpCountryOption,
        ) => left.code === right.code}
        filter={(option: SogpCountryOption, search: string) =>
          matchesSogpCountryQuery(option, search)
        }
        autoHighlight
      >
        <Combobox.Trigger
          className="sogp-phone-country"
          aria-label={`Dialling code: ${country.label} +${country.callingCode}`}
        >
          <CountryFlag code={country.code} />
          <span className="sogp-phone-dial">+{country.callingCode}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </Combobox.Trigger>

        <Combobox.Portal>
          <Combobox.Positioner
            sideOffset={6}
            align="start"
            className="sogp-popup-positioner"
          >
            <Combobox.Popup className="sogp-popup">
              <div className="sogp-popup-search">
                <Search
                  className="size-4 shrink-0 opacity-50"
                  aria-hidden="true"
                />
                <Combobox.Input
                  placeholder="Search countries"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Search countries"
                />
              </div>
              <CountryOptions />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <input
        id="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        onChange={(event) => handleInput(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="sogp-field-input"
      />
    </div>
  );
}
