// Regenerates lib/sogp/country-names.ts from the current libphonenumber-js
// country list and Node's ICU data. Run after bumping libphonenumber-js:
//   npm run build:country-names
import { getCountries } from "libphonenumber-js/min";
import { writeFileSync } from "node:fs";

const names = new Intl.DisplayNames(["en-GB"], { type: "region" });
const codes = [...getCountries()].sort();
const entries = codes
  .map((code) => `  ${code}: ${JSON.stringify(names.of(code) ?? code)},`)
  .join("\n");

writeFileSync(
  "lib/sogp/country-names.ts",
  `// Generated file — do not edit by hand.
//
// Country names are frozen here rather than read from \`Intl.DisplayNames\` at
// runtime because Node and browser ICU data disagree on a handful of regions
// (the Falklands, for one). Those disagreements became hydration mismatches
// once the country pickers started server-rendering their full <option> lists.
// Regenerate with \`npm run build:country-names\` after bumping libphonenumber-js.

export const SOGP_COUNTRY_NAMES: Record<string, string> = {
${entries}
};
`,
);

console.log(`wrote ${codes.length} country names`);
