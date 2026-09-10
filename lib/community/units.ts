/**
 * Location-unit helpers. A unit is keyed on `(countryCode, regionKey)` where
 * `regionKey` is a canonical slug for a state / province / region, or `null`
 * for a country-level unit.
 *
 * Only Nigeria has a curated state list for now; every other country resolves
 * to a country-level unit until its regions are curated.
 */

import { getSogpCountry, resolveSogpCountryCode } from "../sogp/countries";

/** Canonical Nigerian states + FCT. */
export const NIGERIA_STATES = [
  "abia",
  "adamawa",
  "akwa-ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross-river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "fct",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara",
] as const;

export type NigeriaState = (typeof NIGERIA_STATES)[number];

const NIGERIA_STATE_SET = new Set<string>(NIGERIA_STATES);

/** Display labels for the enrolment state selector; the value stored in
 * `sogp_enrollments.region` is the label, which `canonicalRegionKey` slugifies
 * back to the key above. */
export const NIGERIA_STATE_LABELS: string[] = NIGERIA_STATES.map((key) =>
  key === "fct"
    ? "FCT (Abuja)"
    : key
        .split("-")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" "),
);

/** Common free-text variants → canonical state slug. */
const NIGERIA_ALIASES: Record<string, NigeriaState> = {
  abuja: "fct",
  "federal-capital-territory": "fct",
  "fct-abuja": "fct",
  "akwa-ibom": "akwa-ibom",
  akwaibom: "akwa-ibom",
  "cross-river": "cross-river",
  crossriver: "cross-river",
  // Major cities → their state.
  ibadan: "oyo",
  "port-harcourt": "rivers",
  portharcourt: "rivers",
  "benin-city": "edo",
  benin: "edo",
  warri: "delta",
  uyo: "akwa-ibom",
  aba: "abia",
  onitsha: "anambra",
  awka: "anambra",
  abeokuta: "ogun",
  "ado-ekiti": "ekiti",
  akure: "ondo",
  osogbo: "osun",
  ilorin: "kwara",
  jos: "plateau",
  maiduguri: "borno",
  kaduna: "kaduna",
  kano: "kano",
  enugu: "enugu",
  calabar: "cross-river",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Reduce a free-text region to a canonical `regionKey`, or `null` when it
 * cannot be placed (→ country-level unit).
 */
export function canonicalRegionKey(
  countryCode: string,
  rawRegion: string | null | undefined,
): string | null {
  if (countryCode?.toUpperCase() !== "NG") return null;
  if (!rawRegion) return null;

  // Take the first segment of things like "Osun/Ogun" or "Lagos, Nigeria".
  const firstSegment = rawRegion.split(/[/,|]/)[0] ?? rawRegion;
  let slug = slugify(firstSegment);
  if (!slug) return null;

  slug = slug.replace(/-(state|province|region)$/i, "");

  if (NIGERIA_STATE_SET.has(slug)) return slug;
  if (NIGERIA_ALIASES[slug]) return NIGERIA_ALIASES[slug];
  return null;
}

/** Human-readable unit name, e.g. "Lagos, Nigeria" or "Nigeria". */
export function buildUnitName(
  countryCode: string,
  regionKey: string | null,
): string {
  const country =
    getSogpCountry(resolveSogpCountryCode(countryCode))?.label ?? countryCode;
  if (!regionKey) return country;
  const region = regionKey
    .split("-")
    .map((part) =>
      part === "fct" ? "FCT" : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");
  return `${region}, ${country}`;
}
