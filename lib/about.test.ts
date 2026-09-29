import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  ABOUT_HOBBIES,
  ABOUT_TRAVEL,
  aboutDescription,
  aboutSteps,
  paymentList,
  paymentSentence,
} from "./about.ts";
import { META_DESCRIPTION_MAX } from "./home.ts";

Deno.test("the about meta description fits a search result", () => {
  const text = aboutDescription("Da Nang, Vietnam");
  assert(
    text.length <= META_DESCRIPTION_MAX,
    `${text.length} characters, expected <= ${META_DESCRIPTION_MAX}: "${text}"`,
  );
});

Deno.test("the about meta description names the city it is given", () => {
  assert(aboutDescription("Example City").includes("Example City"));
});

Deno.test("the about story runs from 2010 to today in four steps", () => {
  assertEquals(aboutSteps.map((s) => s.when), [
    "2010",
    "2013",
    "Later",
    "Today",
  ]);
});

/**
 * Words and phrases from the 2022 post that the About copy must leave out:
 * its income figures, the loan, the 80/20 split and its goal to quit
 * freelancing. A word list, not proof that every claim has a source.
 */
const BANNED_WORDS = ["quit", "exit", "loan", "income", "salary"];
const BANNED_PHRASES = ["80/20", "80%", "per month", "leave freelance"];

/** A money amount: a currency sign before a number, or a currency word or "k" after one. */
const MONEY = /[$€£]\s?\d|\d\s?(usd|eur|dollars?|euros?)\b|\d\s?k\b/i;

/** Every piece of About copy `lib/about.ts` exports, as one text. */
const aboutCopy = [
  ...aboutSteps.map((s) => s.text),
  aboutDescription("Example City"),
  ABOUT_HOBBIES,
  ABOUT_TRAVEL,
  paymentSentence(),
  paymentList(),
].join(" ");

Deno.test("the about copy names no income, loan, 80/20 split or exit goal from the post", () => {
  for (const word of BANNED_WORDS) {
    assert(
      !new RegExp(`\\b${word}\\b`, "i").test(aboutCopy),
      `about copy mentions "${word}"`,
    );
  }
  for (const phrase of BANNED_PHRASES) {
    assert(
      !aboutCopy.toLowerCase().includes(phrase),
      `about copy mentions "${phrase}"`,
    );
  }
});

Deno.test("the about copy states no money amount", () => {
  const found = aboutCopy.match(MONEY);
  assert(!found, `about copy has a money amount: "${found?.[0]}"`);
});
