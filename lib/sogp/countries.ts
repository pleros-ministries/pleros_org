import {
  getCountries,
  isSupportedCountry,
  type CountryCode,
} from "libphonenumber-js/min";

const countryNames = new Intl.DisplayNames(["en-GB"], { type: "region" });

export type SogpCountryOption = {
  code: CountryCode;
  label: string;
};

export const SOGP_COUNTRIES: SogpCountryOption[] = getCountries()
  .map((code) => ({ code, label: countryNames.of(code) ?? code }))
  .sort((left, right) => left.label.localeCompare(right.label, "en-GB"));

export function resolveSogpCountryCode(value?: string | null): CountryCode {
  const normalized = value?.trim().toUpperCase();
  return normalized && isSupportedCountry(normalized)
    ? normalized
    : "NG";
}

export function getSogpCountry(code: CountryCode) {
  return SOGP_COUNTRIES.find((country) => country.code === code) ?? null;
}
