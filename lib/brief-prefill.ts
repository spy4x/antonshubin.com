// The line a brief starts with when the visitor came from a catalog item
// (`/book?service=<slug>`, #272). No imports, so the lead form island
// can use it without pulling the catalog into its bundle.

/** The editable first line of a brief about one catalog item. */
export function briefPrefill(shortTitle: string): string {
  return `About: ${shortTitle}\n\n`;
}

/**
 * True when `text` holds nothing but the prefill (or nothing at all): the
 * prefill alone does not count as describing an idea or an app.
 */
export function isEmptyBrief(text: string, shortTitle?: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return shortTitle !== undefined &&
    trimmed === briefPrefill(shortTitle).trim();
}
