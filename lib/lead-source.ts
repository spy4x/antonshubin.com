// "Where did you find me?" on the brief form (#729). Shared by the form
// island and `lib/lead.ts`, so it imports nothing.

/** The question, as the form's label and the empty choice show it. */
export const SOURCE_LABEL = "Where did you find me?"

/** The value of the choice that reveals a text box. */
export const OTHER_SOURCE = "other"

/** The choices, in the order the form lists them. */
export const LEAD_SOURCES = [
  { value: "upwork", label: "Upwork" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Someone referred me" },
  { value: "search", label: "Google or another search engine" },
  { value: "ai", label: "An AI assistant (ChatGPT, Claude…)" },
  { value: "youtube", label: "YouTube" },
  { value: OTHER_SOURCE, label: "Other" },
] as const

/** The longest "Other" answer the form takes and the server keeps. */
export const SOURCE_OTHER_MAX = 80

/**
 * The answer as the owner's mail shows it, or `undefined` when there is
 * none. An unknown choice is dropped, never echoed; the free text is used
 * only with the "other" choice, on one line and cut to
 * {@link SOURCE_OTHER_MAX} characters.
 */
export function leadSource(
  source: unknown,
  other: unknown,
): string | undefined {
  const choice = LEAD_SOURCES.find((s) => s.value === source)
  if (!choice) return undefined
  if (choice.value !== OTHER_SOURCE) return choice.label
  const text = typeof other === "string"
    ? other.replace(/\s+/g, " ").trim().slice(0, SOURCE_OTHER_MAX)
    : ""
  return text ? `${choice.label}: ${text}` : choice.label
}
