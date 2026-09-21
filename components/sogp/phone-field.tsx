"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AsYouType,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import examples from "libphonenumber-js/examples.mobile.json";

import {
  getSogpCountryOrDefault,
  SOGP_COUNTRIES,
  type SogpCountryOption,
} from "@/lib/sogp/countries";
import { CountryFlag } from "./country-flag";

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
      {/* The flag, dial code and chevron are painted by us; the transparent
          native <select> on top opens the browser's own picker, which works
          even where a JS-rendered popup does not. */}
      <span className="sogp-phone-country">
        <CountryFlag code={country.code} />
        <span className="sogp-phone-dial">+{country.callingCode}</span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        <select
          className="sogp-phone-country-select"
          aria-label="Country dialling code"
          value={country.code}
          onChange={(event) => {
            const next = SOGP_COUNTRIES.find(
              (option) => option.code === event.target.value,
            );
            if (next) handleCountryChange(next);
          }}
        >
          {SOGP_COUNTRIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label} +{option.callingCode}
            </option>
          ))}
        </select>
      </span>

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
