import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  type CountryCode,
} from "libphonenumber-js/min";

const countryNames = new Intl.DisplayNames(["en-GB"], { type: "region" });

export type SogpCountryOption = {
  code: CountryCode;
  label: string;
  /** International dialling prefix without the leading `+`, e.g. `234`. */
  callingCode: string;
  /** Regional-indicator flag, e.g. 🇳🇬. Falls back to the code on platforms without flag glyphs. */
  flag: string;
  /** Pre-lowercased haystack used by the country search filters. */
  search: string;
};

/** Turns an ISO 3166-1 alpha-2 code into its regional-indicator flag emoji. */
export function countryCodeToFlag(code: string) {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((character) => 0x1f1e6 + character.charCodeAt(0) - 65),
  );
}

/** Strips accents and punctuation so "cote d'ivoire" matches "Côte d’Ivoire". */
function normalizeForSearch(value: string) {
  return value
    .toLocaleLowerCase("en-GB")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const SOGP_COUNTRIES: SogpCountryOption[] = getCountries()
  .map((code) => {
    const label = countryNames.of(code) ?? code;
    const callingCode = getCountryCallingCode(code);
    return {
      code,
      label,
      callingCode,
      flag: countryCodeToFlag(code),
      search: normalizeForSearch(
        `${label} ${code} +${callingCode} ${callingCode}`,
      ),
    };
  })
  .sort((left, right) => left.label.localeCompare(right.label, "en-GB"));

const countriesByCode = new Map(
  SOGP_COUNTRIES.map((country) => [country.code, country]),
);

export function resolveSogpCountryCode(value?: string | null): CountryCode {
  const normalized = value?.trim().toUpperCase();
  return normalized && isSupportedCountry(normalized) ? normalized : "NG";
}

export function getSogpCountry(code: CountryCode) {
  return countriesByCode.get(code) ?? null;
}

export function getSogpCountryOrDefault(code: CountryCode) {
  return getSogpCountry(code) ?? getSogpCountry("NG")!;
}

/**
 * Matches a country against a typed query. Every whitespace-separated term has
 * to start a word in the country's name, ISO code or dialling code, so "ghan"
 * finds Ghana rather than Afghanistan, while "united king" and "ng 234" still
 * narrow the way people expect a country picker to behave.
 */
export function matchesSogpCountryQuery(
  country: SogpCountryOption,
  query: string,
) {
  const normalized = normalizeForSearch(query);
  if (!normalized) return true;
  return normalized
    .split(" ")
    .every(
      (term) =>
        country.search.startsWith(term) ||
        country.search.includes(` ${term}`) ||
        country.search.includes(`+${term}`),
    );
}
