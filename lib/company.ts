/**
 * Anton's company: its legal name, country and Singapore registration number
 * (UEN). Reads no environment, so `lib/about.ts` and the pages can import it
 * as well as `lib/config.ts`. The invoices sentence, both llms files, the
 * About page and the `Organization` JSON-LD read it here, so a change of
 * company is one edit.
 */
export const COMPANY = {
  name: "NeatSoft PTE LTD",
  country: "Singapore",
  uen: "202300222R",
} as const;

/** The company as one line: name, country and UEN. */
export const COMPANY_LINE =
  `${COMPANY.name}, ${COMPANY.country} (UEN ${COMPANY.uen})`;
