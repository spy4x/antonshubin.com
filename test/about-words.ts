// The words the About copy must leave out (#294): the 2022 post's income
// figures, the loan, the 80/20 split and its goal to quit freelancing.
// `lib/about.test.ts` runs it on the copy `lib/about.ts` exports and
// `test/about.test.ts` on the rendered page's visible text. A word list, not
// proof that every claim has a source.

const BANNED_WORDS = ["quit", "exit", "loan", "income", "salary"];
const BANNED_PHRASES = ["80/20", "80%", "per month", "leave freelance"];

/** A money amount in figures: a currency sign before a number, or a currency word or "k" after one. */
const MONEY_IN_FIGURES =
  /[$€£]\s?\d|\d\s?(usd|eur|dollars?|euros?)\b|\d\s?k\b/i;

/** A money amount in words, such as "five thousand dollars". */
const MONEY_IN_WORDS =
  /\b(hundreds?|thousands?|millions?|billions?)\b[^.]{0,40}?\b(dollars?|usd|euros?|eur|bucks)\b/i;

/** Every banned word or phrase `text` contains, lowercased. */
export function bannedWordsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return [
    ...BANNED_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower)),
    ...BANNED_PHRASES.filter((p) => lower.includes(p)),
  ];
}

/** The first money amount in `text`, in figures or in words, or `undefined`. */
export function moneyAmountIn(text: string): string | undefined {
  return (text.match(MONEY_IN_FIGURES) ?? text.match(MONEY_IN_WORDS))?.[0];
}
