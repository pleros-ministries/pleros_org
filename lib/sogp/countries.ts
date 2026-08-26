import {
  getCountries,
  isSupportedCountry,
  type Country,
} from "react-phone-number-input";
import countryLabels from "react-phone-number-input/locale/en.json";

export type SogpCountryOption = {
  code: Country;
  label: string;
};

export const SOGP_COUNTRIES: SogpCountryOption[] = getCountries()
  .map((code) => ({ code, label: countryLabels[code] ?? code }))
  .sort((left, right) => left.label.localeCompare(right.label, "en-GB"));

export function resolveSogpCountryCode(value?: string | null): Country {
  const normalized = value?.trim().toUpperCase();
  return normalized && isSupportedCountry(normalized)
    ? normalized
    : "NG";
}

export function getSogpCountry(code: Country) {
  return SOGP_COUNTRIES.find((country) => country.code === code) ?? null;
}
